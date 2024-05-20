const { socksDispatcher } = require("fetch-socks");
const { ProxyAgent, fetch } = require("undici");
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
  const proxyDetails = await fetchProxies();
  return proxyDetails.map((detail) => detail.proxy);
}

/**
 * @param {string} proxyString
 */
function getProxyDispatcher(proxyString) {
  const uri = new URL(proxyString);
  if (uri.protocol.startsWith("socks")) {
    return socksDispatcher(
      {
        type: parseInt(uri.protocol.substring(5)),
        host: uri.hostname,
        port: parseInt(uri.port),
      },
      { timeout: 120_000 }
    );
  }
  if (uri.protocol.startsWith("http")) {
    return new ProxyAgent({
      uri: proxyString,
    });
  }
  return undefined;
}

/**
 * @param {string} proxyString
 */
async function testProxy(proxyString) {
  const dispatcher = getProxyDispatcher(proxyString);
  const fetchOptions = {
    dispatcher,
    signal: AbortSignal.timeout(120_000),
  };
  try {
    const results = await getSearchResults("amelie", fetchOptions);
    return results.length > 0;
  } catch (e) {
    if ("cause" in e) {
      console.log(String(e.cause).split("\n")[0]);
    } else {
      console.error(e);
    }
  }
  return false;
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

module.exports = { getProxies, filterAlive, getProxyDispatcher, testProxy };
