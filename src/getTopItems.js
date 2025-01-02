const { computeScore } = require("./score");
const { cartesian } = require("./utils/cartesian");
const { deduplicateByProp } = require("./utils/deduplicateByProp");

/** @typedef {import('./meta.js').Meta} Meta */
/** @typedef {import('../userConfig/userConfig.js').UserConfigData} UserConfigData */

/**
 * @typedef {{
 *  resolverId: string;
 *  title: string;
 *  detailPageUrl:string;
 *  duration: number;
 *  format?: string;
 *  size: number;
 * }} SearchResult
 */

/**
 * @typedef {SearchResult & {
 *  video: string;
 *  subtitles?: string[];
 * resolverName: string;
 * }} StreamResult
 */

/**
 * @typedef {{
 *  resolverName: string;
 *  prepare: () => Promise<void>;
 *  init: () => Promise<boolean>;
 *  validateConfig: (config: UserConfigData) => Promise<boolean>;
 *  search: (title: string) => Promise<SearchResult[]>;
 *  resolve: (SearchResult) => Promise<StreamResult>;
 * }} Resolver
 */

/**
 *
 * @param {Meta} meta
 * @param {Resolver[]} allResolvers
 * @param {UserConfigData} config
 * @returns {Promise<StreamResult[]>}
 */
async function getTopItems(meta, allResolvers, config) {
  const resolvers = await getActiveResolvers(allResolvers, config);
  const searchTerms = getSearchTerms(meta);

  const searchResults = deduplicateByProp(
    (
      await Promise.allSettled(
        cartesian(resolvers, searchTerms).map(
          /** @param {[Resolver, string]} param0 */
          async ([resolver, searchTerm]) => {
            const searchResults = await resolver.search(searchTerm, config);
            const scoredSearchResults = searchResults
              .map((r) => ({
                resolverName: resolver.resolverName,
                score: computeScore(meta, r),
                ...r,
              }))
              .filter((r) => r.score > 0);

            scoredSearchResults.sort(compareScores);
            const topItems =
              scoredSearchResults.length > 7
                ? scoredSearchResults.slice(0, 7)
                : scoredSearchResults;
            return topItems;
          },
        ),
      )
    )
      .map((r) => (r.status === "fulfilled" && r.value ? r.value : null))
      .filter((r) => Array.isArray(r))
      .flat(),
    "resolverId",
  );

  console.log(searchResults);

  const results = (
    await Promise.allSettled(
      searchResults.map(async (searchResult) => {
        const resolver = resolvers.find(
          (r) => searchResult.resolverName === r.resolverName,
        );
        if (!resolver) {
          return null;
        }
        try {
          const data = await resolver.resolve(searchResult, config);
          return {
            ...searchResult,
            video: data.video,
            subtitles: data.subtitles,
          };
        } catch (e) {
          console.log(
            "Failed to load video detail:",
            searchResult.detailPageUrl,
            e,
          );
        }
      }),
    )
  )
    .map((r) => (r.status === "fulfilled" && r.value ? r.value : null))
    .filter((r) => Boolean(r));

  results.sort(compareScores);

  return results;
}

/**
 *
 * @param {Resolver[]} allResolvers
 * @param {UserConfigData} config
 * @returns {Promise<Resolver[]>}
 */
async function getActiveResolvers(allResolvers, config) {
  const resolvers = (
    await Promise.all(
      allResolvers.map(async (r) => ({
        resolver: r,
        valid: await r.validateConfig(config),
      })),
    )
  )
    .filter((obj) => obj.valid)
    .map((obj) => obj.resolver);
  return resolvers;
}

/**
 * @param {Meta} meta
 * @returns {string[]}
 */
function getSearchTerms(meta) {
  /** @type {string[]} */
  const searches = [];

  if (meta.episode) {
    const eps = String(meta.episode.season).padStart(2, "0");
    const epn = String(meta.episode.number).padStart(2, "0");

    if (meta.names.en) {
      searches.push(`${meta.names.en} S${eps}E${epn}`);
      searches.push(`${meta.names.en} ${eps}x${epn}`);
    }
    if (meta.names.cs) {
      searches.push(`${meta.names.cs} S${eps}E${epn}`);
      searches.push(`${meta.names.cs} ${eps}x${epn}`);
    }
  } else {
    const releaseYear = new Date(meta.released).getFullYear();
    if (meta.names.en) {
      searches.push(`${meta.names.en} ${releaseYear}`);
    }
    if (meta.names.cs) {
      searches.push(`${meta.names.cs} ${releaseYear}`);
    }
  }
  return searches;
}

function compareScores(a, b) {
  return b.score - a.score;
}

module.exports = { getTopItems };
