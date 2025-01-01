const { parseHTML } = require("linkedom");
const CryptoJS = require("crypto-js");
const { sizeToBytes } = require("../utils/convert.js");
const commonHeaders = require("../utils/headers.js");
const { md5crypt } = require("../utils/webshareCrypto.js");

const headers = {
  ...commonHeaders,
  accept: "application/xml",
  Referer: "https://webshare.cz/",
};

async function getSalt(userName) {
  const pageResponse = await fetch("https://webshare.cz/api/salt/", {
    headers: {
      ...headers,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: `username_or_email=${encodeURIComponent(userName)}`,
    method: "POST",
  });
  const pageHtml = await pageResponse.text();
  const { document } = parseHTML(pageHtml);
  const statusEl = document.querySelector("status");
  const saltEl = document.querySelector("salt");
  const salt = saltEl?.innerHTML;

  if (statusEl.innerHTML !== "OK" || !salt) {
    return "";
  }
  return salt;
}

/**
 * Get headers for authenticated response
 * @param {string} userName
 * @param {string} password
 */
async function login(userName, password) {
  const salt = await getSalt(userName);
  const hash = CryptoJS.SHA1(md5crypt(password, salt)).toString();
  const pageResponse = await fetch("https://webshare.cz/api/login/", {
    headers: {
      ...headers,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: `username_or_email=${encodeURIComponent(userName)}&password=${encodeURIComponent(
      hash,
    )}&keep_logged_in=1`,
    method: "POST",
  });

  const pageHtml = await pageResponse.text();
  const { document } = parseHTML(pageHtml);
  const statusEl = document.querySelector("status");
  const tokenEl = document.querySelector("token");
  const wst = tokenEl?.innerHTML;

  if (statusEl.innerHTML !== "OK" || !wst) {
    return {};
  }
  return { wst };
}

const tokensCache = new Map();
/**
 * Get tokens authenticated response
 * @param {string} userName
 * @param {string} password
 */
async function getTokens(userName, password) {
  const cacheKey = `${userName}:${password}`;
  const tokens = tokensCache.get(cacheKey);
  if (tokens) {
    return tokens;
  }

  const newTokens = await login(userName, password);
  tokensCache.set(cacheKey, newTokens);
  return newTokens;
}

async function getResultStreamUrls(result, tokens = {}) {
  const pageResponse = await fetch("https://webshare.cz/api/file_link/", {
    headers: {
      ...headers,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: `ident=${result.ident}&category=video&wst=${tokens.wst}`,
    method: "POST",
  });

  const pageHtml = await pageResponse.text();
  const { document } = parseHTML(pageHtml);

  const statusEl = document.querySelector("status");
  let video = "";

  try {
    const linkRegex = /\<link\>(.*)\<\/link\>/s;
    const linkContent = linkRegex.exec(pageHtml)?.[1];
    video = linkContent;
  } catch (error) {
    console.log("error parsing streams", error);
  }

  if (statusEl.innerHTML !== "OK" || !video) {
    return { failed: true };
  }

  return { video };
}

async function getSearchResults(title, tokens = {}) {
  const pageResponse = await fetch("https://webshare.cz/api/search/", {
    headers: {
      ...headers,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: `what=${encodeURIComponent(title)}&category=video&wst=${tokens.wst}`,
    method: "POST",
  });

  const pageHtml = await pageResponse.text();
  const { document } = parseHTML(pageHtml);
  const files = document.querySelectorAll("file");
  const results = [...files].map((fileEl) => {
    const sizeStr = fileEl.querySelector("size").innerHTML.toUpperCase();
    const id = fileEl.querySelector("ident").innerHTML;

    return {
      resolverId: id,
      title: fileEl.querySelector("name").innerHTML,
      ident: id,
      format: fileEl.querySelector("type").innerHTML, // TODO
      size: sizeToBytes(sizeStr),
      isProtected: fileEl.querySelector("password").innerHTML !== "0",
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
    resolverName: "WebShare",

    prepare: async () => {},

    init: async () => {},

    validateConfig: async (addonConfig) => {
      if (!addonConfig.webshareUsername || !addonConfig.websharePassword) {
        return false;
      }
      const tokens = await getTokens(
        addonConfig.webshareUsername,
        addonConfig.websharePassword,
      );

      console.log({
        u: addonConfig.webshareUsername,
        p: addonConfig.websharePassword,
        tokens,
      });
      return "wst" in tokens;
    },

    search: async (title, addonConfig) => {
      const fetchOptions = await getTokens(
        addonConfig.webshareUsername,
        addonConfig.websharePassword,
      );
      return getSearchResults(title, fetchOptions);
    },

    resolve: async (searchResult, addonConfig) => {
      const fetchOptions = await getTokens(
        addonConfig.webshareUsername,
        addonConfig.websharePassword,
      );
      return {
        ...searchResult,
        ...(await getResultStreamUrls(searchResult, fetchOptions)),
      };
    },
  };
}

module.exports = { getResolver };
