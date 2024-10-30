const { computeScore } = require("./score");
const { cartesian } = require("./utils/cartesian");

/** @typedef {import('./meta.js').Meta} Meta */
/** @typedef {import('../userConfig/userConfig.js').UserConfigData} UserConfigData */

/**
 * @typedef {{
 *  title: string;
 *  detailPageUrl:string;
 *  duration: number;
 *  format?: string;
 *  size: number;
 *  detailPageUrl: string;
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
 *  search: (title: string) => Promise<SearchResult[]>;
 *  resolve: (SearchResult) => Promise<StreamResult>;
 * }} Resolver
 */

/**
 *
 * @param {Meta} meta
 * @param {Resolver[]} resolvers
 * @param {UserConfigData} config
 * @returns {Promise<StreamResult[]>}
 */
async function getTopItems(meta, resolvers, config) {
  /** @type {string[]} */
  const searchTerms = [];

  if (meta.episode) {
    const episodeSignature = [
      "s",
      String(meta.episode.season).padStart(2, "0"),
      "e",
      String(meta.episode.number).padStart(2, "0"),
    ].join("");
    searchTerms.push(`${meta.names.en} ${episodeSignature}`);
    searchTerms.push(`${meta.names.cs} ${episodeSignature}`);
    searchTerms.push(
      `${meta.names.en} ${meta.episode.season}x${meta.episode.number}`,
    );
    searchTerms.push(
      `${meta.names.cs} ${meta.episode.season}x${meta.episode.number}`,
    );
  } else {
    searchTerms.push(meta.names.en);
    searchTerms.push(meta.names.cs);
  }

  const searchResults = (
    await Promise.allSettled(
      cartesian(resolvers, searchTerms).map(
        /** @param {[Resolver, string]} param0 */
        async ([resolver, searchTerm]) => {
          const searchResults = await resolver.search(searchTerm, config);
          return searchResults.map((r) => ({
            ...r,
            resolverName: resolver.resolverName,
            score: computeScore(meta, r),
          }));
        },
      ),
    )
  )
    .map((r) => (r.status === "fulfilled" && r.value ? r.value : null))
    .filter((r) => Array.isArray(r))
    .flat()
    .filter((r) => r.score > 0);

  searchResults.sort((a, b) => b.score - a.score);

  const topItems =
    searchResults.length > 7 ? searchResults.slice(0, 7) : searchResults;

  const results = (
    await Promise.allSettled(
      topItems.map(async (searchResult) => {
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

  return results;
}

module.exports = { getTopItems };
