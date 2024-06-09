const { parseHTML } = require("linkedom");
const { fetch } = require("undici");
const { timeToSeconds, sizeToBytes } = require("../utils/convert.js");

const headers = {
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "accept-language": "en-GB,en;q=0.5",
  "sec-ch-ua": '"Brave";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "same-origin",
  "sec-fetch-user": "?1",
  "sec-gpc": "1",
  "upgrade-insecure-requests": "1",
  Referer: "https://zalohuj.si/",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

/**
 * Het headers for authenticated response
 * @param {string} userName
 * @param {string} password
 */
async function login(userName, password) {
  const result = await fetch("https://prehraj.to/", {
    headers: {
      ...headers,
      redirect: "manual",
      "content-type": "application/x-www-form-urlencoded",
      Referer: "https://prehraj.to/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    body: `email=${encodeURIComponent(userName)}&password=${encodeURIComponent(
      password,
    )}&remember=on&_submit=P%C5%99ihl%C3%A1sit+se&_do=login-loginForm-submit`,
    method: "POST",
  });
  const cookies = result.headers
    .getSetCookie()
    .map((cookie) => {
      const parts = cookie.split(";");
      const [name, value] = parts[0].split("=");
      return { name, value };
    })
    .filter((cookie) => cookie.value.toLowerCase() !== "deleted");

  return {
    headers: {
      cookie: cookies.map(({ name, value }) => `${name}=${value}`).join("; "),
    },
  };
}

async function getResultStreamUrls(result, fetchOptions = {}) {
  const detailPageUrl = result.detailPageUrl;
  const pageResponse = await fetch(detailPageUrl, {
    ...fetchOptions,
    headers: {
      ...headers,
      ...(fetchOptions.headers ?? {}),
    },
    referrerPolicy: "strict-origin-when-cross-origin",
    body: null,
    method: "GET",
  });
  const pageHtml = await pageResponse.text();
  const { document } = parseHTML(pageHtml);

  const iframeEl = document.querySelector('iframe[src*="embed"]');
  const iframeSrc = iframeEl.getAttribute("src");

  const iframeResponse = await fetch(iframeSrc, {
    ...fetchOptions,
    headers: {
      ...headers,
      ...(fetchOptions.headers ?? {}),
    },
    referrerPolicy: "strict-origin-when-cross-origin",
    body: null,
    method: "GET",
  });
  const iframeHtml = await iframeResponse.text();
  const { document: iframe } = parseHTML(iframeHtml);

  const videoEl = iframe.querySelector("video");
  const video = videoEl
    .querySelector('source[type^="video/"]')
    .getAttribute("src");
  let subtitles = [...videoEl.querySelectorAll('track[kind="captions"]')].map(
    (el) => ({
      id: el.getAttribute("label"),
      url: el.getAttribute("src"),
      lang: el.getAttribute("srclang"),
    }),
  );

  return {
    detailPageUrl,
    video,
    subtitles,
  };
}

async function getSearchResults(title, fetchOptions = {}) {
  const pageResponse = await fetch(
    `https://zalohuj.si/search/?s=${encodeURIComponent(title)}`,
    {
      ...fetchOptions,
      headers: {
        ...headers,
        ...(fetchOptions.headers ?? {}),
      },
      body: null,
      method: "GET",
    },
  );
  const pageHtml = await pageResponse.text();
  const { document } = parseHTML(pageHtml);
  const items = document.querySelectorAll(".result-item-hex");

  const results = [...items].map((itemEl) => {
    const sizeStr = itemEl.querySelector(".meta .size").innerText.toUpperCase();

    const titleEl = itemEl.querySelector("h2 a");
    return {
      title: titleEl.innerText,
      detailPageUrl: `https://zalohuj.si${titleEl.getAttribute("href")}`,
      duration: undefined,
      format: undefined, // TODO
      size: sizeToBytes(sizeStr),
    };
  });
  return results;
}

/** @typedef {import('../getTopItems.js').Resolver} Resolver */

/** @typedef {{userName: string, password: string}} Init */

/**
 * @param {Object?} Init
 * @returns Resolver
 */
function getResolver(initOptions) {
  let fetchOptions = {};
  return {
    resolverName: "ZalohujSi",
    prepare: () => Promise.resolve(),
    init: async () => {
      if (initOptions) {
        const { userName, password } = initOptions;
        fetchOptions = await login(userName, password);
      }
    },

    search: (title) => getSearchResults(title, fetchOptions),
    resolve: async (searchResult) => ({
      ...searchResult,
      ...(await getResultStreamUrls(searchResult, fetchOptions)),
    }),
  };
}

module.exports = { getResolver };
