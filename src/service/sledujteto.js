const { parseHTML } = require("linkedom");
const { timeToSeconds, sizeToBytes } = require("../utils/convert.js");
const { extractCookies, headerCookies } = require("../utils/cookies.js");
const commonHeaders = require("../utils/headers.js");

const headers = {
  ...commonHeaders,
  accept: "application/json",
  host: "www.sledujteto.cz",
  referer: "https://www.sledujteto.cz/",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

/**
 * Get headers for authenticated response
 * @param {string} userName
 * @param {string} password
 */
async function login(userName, password) {
  if (!userName) {
    return loginAnonymous();
  }

  const r1 = await fetch("https://www.sledujteto.cz/account/login/", {
    headers: {
      ...headers,
      "content-type": "application/x-www-form-urlencoded",
    },
    redirect: "manual",
    body: `email=${encodeURIComponent(userName)}&password=${encodeURIComponent(
      password,
    )}&remember=1&login=P%C5%99ihl%C3%A1sit&form_id=Form_Login&model_id=0`,
    method: "POST",
  });
  const cookies = extractCookies(r1);

  return {
    headers: headerCookies(cookies),
  };
}

async function loginAnonymous() {
  const result = await fetch("https://www.sledujteto.cz/", {
    headers,
    method: "GET",
  });

  const cookies = extractCookies(result);

  return {
    headers: headerCookies(cookies),
  };
}

const fetchOptionsCache = new Map();
/**
 * Get headers for authenticated response
 * @param {string} userName
 * @param {string} password
 */
async function getFetchOptions(userName, password) {
  const cacheKey = `${userName}:${password}`;
  const fetchOptions = fetchOptionsCache.get(cacheKey);
  if (fetchOptions) {
    return fetchOptions;
  }

  const newFetchOptions = await login(userName, password);
  fetchOptionsCache.set(cacheKey, newFetchOptions);
  return newFetchOptions;
}

async function getResultStreamUrls(result, fetchOptions = {}) {
  const pageResponse = await fetch(
    "https://www.sledujteto.cz/services/add-file-link",
    {
      headers: {
        ...headers,
        ...(fetchOptions.headers ?? {}),
        "content-type": "application/json;charset=UTF-8",
      },
      body: JSON.stringify({
        params: {
          id: result.resolverId,
        },
      }),
      method: "POST",
    },
  );
  const pageData = await pageResponse.json();
  return {
    detailPageUrl: result.detailPageUrl,
    video: `https://www.sledujteto.cz/player/index/sledujteto/${pageData.hash}`,
    subtitles: [],
    behaviorHints: {
      notWebReady: true,
      proxyHeaders: {
        request: {
          ...headers,
          ...(fetchOptions.headers ?? {}),
        },
      },
    },
  };
}

async function getSearchResults(title, fetchOptions = {}) {
  const pageResponse = await fetch(
    `https://www.sledujteto.cz/services/get-files?query=${encodeURIComponent(title)}&limit=32&page=1&sort=relevance&collection=?vp-page=0`,
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
  if (pageData.error) {
    return [];
  }

  const results = pageData.files.map((file) => {
    return {
      resolverId: file.id,
      title: file.filename,
      detailPageUrl: file.full_url,
      duration: timeToSeconds(file.movie_duration),
      format: file.movie_resolution,
      size: sizeToBytes(file.filesize),
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
    resolverName: "SledujteTo",

    prepare: async () => {},

    init: async () => {},

    validateConfig: async (addonConfig) => {
      //      if (!addonConfig.sledujtetoUsername || !addonConfig.sledujtetoPassword) {
      //        return false;
      //      }
      const fetchOptions = await getFetchOptions(
        addonConfig.sledujtetoUsername ?? "",
        addonConfig.sledujtetoPassword,
      );
      return "headers" in fetchOptions;
    },

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
