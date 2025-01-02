const { parseHTML } = require("linkedom");
const { fetch } = require("undici");
const { sizeToBytes, timeToSeconds } = require("../utils/convert.js");

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
  const result = await fetch("https://fastshare.cloud/", {
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

function getSearchToken() {
  const token =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  return token;
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

  return {
    title: document
      .querySelector("meta[name=description]")
      ?.getAttribute("content")
      .replace(/online ke zhlédnutí a stažení/, "")
      .trim(),
    detailPageUrl,
    video: `https://fastshare.cloud${document
      .querySelector("form#form")
      .getAttribute("action")}`,
    subtitles: [],
  };
}

async function getSearchResults(title, fetchOptions = {}) {
  const params = new URLSearchParams({
    token: getSearchToken(),
    u: "",
    term: Buffer.from(title).toString("base64"),
    search_purpose: 0,
    search_resolution: 0,
    plain_search: 0,
    limit: 1,
    order: 3,
    type: "video",
    step: 3,
  });
  const pageResponse = await fetch(
    `https://fastshare.cloud/test2.php?${params}`,
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
  const pageHtml = `<html><ul>${await pageResponse.text()}</ul></html>`;
  const { document } = parseHTML(pageHtml);
  const items = document.querySelectorAll("html ul > li");
  const results = [...items].map((listEl) => {
    const detailEl = listEl.querySelector(".video_detail");
    const linkEl = detailEl.querySelector("a");
    const sizeStr = detailEl.querySelector(".pull-right").innerHTML;

    return {
      title: linkEl.innerText,
      detailPageUrl: linkEl.getAttribute("href"),
      duration: timeToSeconds(
        [...detailEl.querySelectorAll(".video_time")][0].innerText.trim(),
      ),
      format: [...detailEl.querySelectorAll(".video_time")][1].innerText.trim(),
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
    resolverName: "Fastshare",
    prepare: () => Promise.resolve(),
    init: async () => {
      if (initOptions) {
        const { userName, password } = initOptions;
        fetchOptions = await login(userName, password);
      }
    },
    validateConfig: async (addonConfig) => {
      return true;
    },
    search: (title, addonConfig) => getSearchResults(title, fetchOptions),
    resolve: async (searchResult, addonConfig) => ({
      ...searchResult,
      ...(await getResultStreamUrls(searchResult, fetchOptions)),
    }),
  };
}

module.exports = { getResolver };

module.exports = { getResolver };
