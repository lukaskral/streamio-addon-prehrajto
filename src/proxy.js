const { HttpsProxyAgent } = require("https-proxy-agent");
const { SocksProxyAgent } = require("socks-proxy-agent");
//var ProxyLists = require("proxy-lists");
const { getSearchResults } = require("./prehrajto");

/**
 * @typedef {{
 *   alive: boolean,
 *   anonymity: string,
 *   ip_data: {
 *     countryCode: string,
 *     mobile: boolean,
 *   },
 *   protocol: string,
 *   port: number,
 *   proxy: string,
 *   ssl: boolean,
 *   ip: string,
 * }} ProxyDetails
 */

/**
 * @returns {Promise<ProxyDetails[]>}
 **/
async function fetchProxies() {
  const result = await fetch(
    "https://api.proxyscrape.com/v3/free-proxy-list/get?request=getproxies&country=cz,sk&skip=0&proxy_format=protocolipport&format=json&limit=15",
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-GB,en;q=0.9",
        priority: "u=1, i",
        "sec-ch-ua":
          '"Chromium";v="124", "Brave";v="124", "Not-A.Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "sec-gpc": "1",
        Referer: "https://proxyscrape.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: null,
      method: "GET",
    }
  );
  const proxies = (await result.json()).proxies ?? [];
  return proxies;
}

/**
 * @returns {Promise<string[]>}
 **/
async function getProxies() {
  return new Promise((resolve) => {
    const proxies = [];
    resolve(proxies);
  });
}

/**
 * @param {string} proxyString
 */
function getProxyAgent(proxyString) {
  if (proxyString.startsWith("socks")) {
    return new SocksProxyAgent(proxyString);
  }
  if (proxyString.startsWith("http")) {
    return new HttpsProxyAgent(proxyString);
  }
  return undefined;
}

/**
 * @param {string} proxyString
 */
async function testProxy(proxyString) {
  const agent = getProxyAgent(proxyString);
  const fetchOptions = {
    agent,
    signal: AbortSignal.timeout(60_000),
  };
  const results = await getSearchResults("amelie", fetchOptions);
  return results.length > 0;
}

/**
 * @param {string[]} proxies
 * @param {string?} testUrl
 */
async function filterAlive(proxies) {
  return (
    await Promise.allSettled(
      proxies.map(async (proxyString) => [
        proxyString,
        await testProxy(proxyString),
      ])
    )
  )
    .filter((result) => result.status === "fulfilled" && result.value[1])
    .map((result) => result.value[0]);
}

module.exports = { getProxies, filterAlive, getProxyAgent, testProxy };
