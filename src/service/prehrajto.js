const { parseHTML } = require("linkedom");
const { fetch } = require("undici");
const { timeToSeconds, sizeToBytes } = require("../utils/convert.js");
const { extractCookies, headerCookies } = require("../utils/cookies.js");

const headers = {
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "accept-language": "en-GB,en;q=0.5",
  "cache-control": "max-age=0",
  priority: "u=0, i",
  "sec-ch-ua": '"Chromium";v="124", "Brave";v="124", "Not-A.Brand";v="99"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "none",
  "sec-fetch-user": "?1",
  "sec-gpc": "1",
  "upgrade-insecure-requests": "1",
  cookie: "AC=C",
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

  const cookies = extractCookies(result);

  return {
    headers: headerCookies(cookies),
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

  const scriptEls = document.querySelectorAll("script");
  const scriptEl = [...scriptEls].find((el) =>
    el.textContent.includes("sources ="),
  );
  const script = scriptEl.textContent;

  let video = "";
  let subtitles = [];

  try {
    const sourcesRegex = /.*var sources\s*=\s*(\[.*?\])\s*;/s;
    const sources = sourcesRegex.exec(script)[1];
    const items = eval(sources);
    video = items.pop().file;
  } catch (error) {
    console.log("error parsing streams", error);
    const srcRegex = /.*src:\s*"(.*?)".*/s;
    video = srcRegex.exec(script)[1];
  }

  try {
    const sourcesRegex = /.*var tracks\s*=\s*(\[.*?\])\s*;/s;
    const sources = sourcesRegex.exec(script)[1];
    const items = eval(sources);
    subtitles = items
      .filter((item) => item.kind === "captions")
      .map((item) => ({
        id: item.label,
        url: item.src,
        lang: item.srclang,
      }));
  } catch (error) {}

  return {
    detailPageUrl,
    video,
    subtitles,
  };
}

async function getSearchResults(title, fetchOptions = {}) {
  const pageResponse = await fetch(
    `https://prehraj.to/hledej/${encodeURIComponent(title)}?vp-page=0`,
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
  const pageHtml = await pageResponse.text();
  const { document } = parseHTML(pageHtml);
  const links = document.querySelectorAll("a.video--link");
  const results = [...links].map((linkEl) => {
    const sizeStr = linkEl
      .querySelector(".video__tag--size")
      .innerHTML.toUpperCase();

    return {
      title: linkEl.getAttribute("title"),
      detailPageUrl: `https://prehraj.to${linkEl.getAttribute("href")}`,
      duration: timeToSeconds(
        linkEl.querySelector(".video__tag--time").innerHTML,
      ),
      format: linkEl
        .querySelector(".video__tag--format use")
        ?.getAttribute("xlink:href"), // TODO
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
    resolverName: "PrehrajTo",
    init: async () => {
      if (initOptions) {
        const { userName, password } = initOptions;
        fetchOptions = await login(userName, password);
      }
      console.log("prehrajto init", fetchOptions);
    },

    search: (title) => getSearchResults(title, fetchOptions),
    resolve: async (searchResult) => ({
      ...searchResult,
      ...(await getResultStreamUrls(searchResult, fetchOptions)),
    }),
  };
}

module.exports = { getResolver };
