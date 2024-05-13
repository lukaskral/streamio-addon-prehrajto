const { HttpsProxyAgent } = require("https-proxy-agent");
const { SocksProxyAgent } = require("socks-proxy-agent");
var ProxyLists = require("proxy-lists");

/**
 * @typedef {{
 *   proxy: string,
 * }} ProxyDetails
 */

/**
 * @returns {Promise<ProxyDetails[]>}
 **/
async function getProxies() {
  return new Promise((resolve) => {
    const proxies = [];
    ProxyLists.getProxies({
      // options
      countries: ["cz", "sk"],
      anonymityLevels: ["elite"],
      sourcesWhiteList: [
        "proxyscrape-com",
        "foxtools",
        "xroxy",
        "hidester",
        "checkerproxy",
        /*
        
        "freeproxylists-net",
        "proxy50-50-blogspot-com",
        "new-net-time",
        "freeproxylist",
        "proxyhttp-net",
        "sockslist",
        "proxy-daily",
        "hidemyname",
        "freeproxylists",
        "coolproxy",
        "blackhatworld",
        "proxydb",
        "proxies24",
        "openproxy-space",
        "proxy-list-org",
        
        "premproxy",
        "spys-one",
        "proxynova",
        "free-proxy-cz",

        */
      ],
    })
      .on("data", (items) => {
        // Received some proxies.
        items.forEach((item) => {
          item.protocols.forEach((protocol) => {
            proxies.push(`${protocol}://${item.ipAddress}:${item.port}`);
          });
        });
      })
      .once("end", () => {
        // Done getting proxies.
        resolve(proxies);
      });
  });

  return proxies;
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
 * @param {string?} testUrl
 */
async function testProxy(proxyString, testUrl) {
  testing;
  const agent = getProxyAgent(proxyString);
  const response = await fetch(testUrl, {
    agent,
    signal: AbortSignal.timeout(60_000),
  });
  return response.ok ? proxyDetails : false;
}

/**
 * @param {string[]} proxies
 * @param {string?} testUrl
 */
async function filterAlive(proxies, testUrl = "https://prehraj.to/") {
  return (
    await Promise.allSettled(
      proxies.map((proxyString) => testProxy(proxyString, testUrl))
    )
  )
    .map((result) => {
      return result;
    })
    .filter((result) => result.status === "fulfilled" && result.value)
    .map((result) => result.value);
}

module.exports = { getProxies, filterAlive, getProxyAgent, testProxy };
