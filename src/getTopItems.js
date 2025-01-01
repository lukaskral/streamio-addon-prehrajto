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

  /** @type {string[]} */
  const searchTerms = [];

  if (meta.episode) {
    const episodeSignature = [
      "s",
      String(meta.episode.season).padStart(2, "0"),
      "e",
      String(meta.episode.number).padStart(2, "0"),
    ].join("");
    if (meta.names.en) {
      searchTerms.push(`${meta.names.en} ${episodeSignature}`);
      searchTerms.push(
        `${meta.names.en} ${meta.episode.season}x${meta.episode.number}`,
      );
    }
    if (meta.names.cs) {
      searchTerms.push(`${meta.names.cs} ${episodeSignature}`);
      searchTerms.push(
        `${meta.names.cs} ${meta.episode.season}x${meta.episode.number}`,
      );
    }
  } else {
    const releaseYear = new Date(meta.released).getFullYear();
    if (meta.names.en) {
      searchTerms.push(`${meta.names.en} ${releaseYear}`);
    }
    if (meta.names.cs) {
      searchTerms.push(`${meta.names.cs} ${releaseYear}`);
    }
  }

  const searchResults = deduplicateByProp(
    (
      await Promise.allSettled(
        cartesian(resolvers, searchTerms).map(
          /** @param {[Resolver, string]} param0 */
          async ([resolver, searchTerm]) => {
            const searchResults = await resolver.search(searchTerm, config);
            const scoredSearchResults = searchResults.map((r) => ({
              resolverName: resolver.resolverName,
              score: computeScore(meta, searchTerm, r),
              ...r,
            }));

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
      .flat()
      .filter((r) => r.score > 0),
    "resolverId",
  );

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

function compareScores(a, b) {
  return b.score - a.score;
}

module.exports = { getTopItems };
