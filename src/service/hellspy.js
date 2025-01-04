const { parseHTML } = require("linkedom");
const { timeToSeconds, sizeToBytes } = require("../utils/convert.js");
const { extractCookies, headerCookies } = require("../utils/cookies.js");
const commonHeaders = require("../utils/headers.js");

const headers = {
  ...commonHeaders,
  accept: "application/json",
  host: "www.hellspy.to",
  referer: "https://www.hellspy.to/",
};

const fetchOptionsCache = new Map();
/**
 * Get headers for authenticated response
 * @param {string} userName
 * @param {string} password
 */
async function getFetchOptions(userName, password) {
  return {};
}

async function getResultStreamUrls(result, fetchOptions = {}) {
  const linksRegexp = /\\"links\\":(\{.*?\})/gi;
  const detailPageUrl = result.detailPageUrl;
  const pageResponse = await fetch(detailPageUrl, {
    ...fetchOptions,
    headers: {
      ...headers,
      ...(fetchOptions.headers ?? {}),
    },
    method: "GET",
  });
  const pageHtml = await pageResponse.text();
  const videoSourcesJson = linksRegexp
    .exec(pageHtml)[1]
    .replaceAll("\\\u0026", "&")
    .replaceAll('\\"', '"');
  const videoSources = Object.entries(JSON.parse(videoSourcesJson))
    .map(([resolution, link]) => ({ link, resolution: parseInt(resolution) }))
    .filter((o) => o.link)
    .sort((a, b) => b.resolution - a.resolution);

  return {
    detailPageUrl: result.detailPageUrl,
    video: videoSources[0].link,
    subtitles: [],
    behaviorHints: {},
  };
}

async function getSearchResults(title, fetchOptions = {}) {
  const pageResponse = await fetch(
    `https://www.hellspy.to/api/search?query=${encodeURIComponent(title)}&offset=0`,
    {
      ...fetchOptions,
      headers: {
        ...headers,
        ...(fetchOptions.headers ?? {}),
      },
      referrerPolicy: "strict-origin-when-cross-origin",
      body: null,
      method: "GET",
    },
  );

  const pageData = await pageResponse.json();
  if (pageData.status !== "ok") {
    return [];
  }

  const results = pageData.payload.data.map((file) => {
    return {
      resolverId: file.id,
      title: file.name,
      detailPageUrl: `https://www.hellspy.to/video/${file.slug}/${file.id}`,
      duration: file.length,
      format: file.movie_resolution,
      size: parseInt(file.size),
    };
  });

  return results;
}

/** @typedef {import('../getTopItems.js').Resolver} Resolver */

/**
 * @returns Resolver
 */
function getResolver() {
  return {
    resolverName: "HellspyTo",

    prepare: async () => {},

    init: async () => {},

    validateConfig: async (addonConfig) => true,

    search: async (title, addonConfig) => {
      const fetchOptions = await getFetchOptions(
        addonConfig.sledujtetoUsername ?? "",
        addonConfig.sledujtetoPassword,
      );
      return getSearchResults(title, fetchOptions);
    },

    resolve: async (searchResult, addonConfig) => {
      const fetchOptions = await getFetchOptions(
        addonConfig.sledujtetoUsername ?? "",
        addonConfig.sledujtetoPassword,
      );
      return {
        ...searchResult,
        ...(await getResultStreamUrls(searchResult, fetchOptions)),
      };
    },
  };
}

module.exports = { getResolver };
