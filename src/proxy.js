const { HttpsProxyAgent } = require("https-proxy-agent");
const { SocksProxyAgent } = require("socks-proxy-agent");
var ProxyLists = require("proxy-lists");
const { getSearchResults } = require("./prehrajto");

/**
 * @returns {Promise<string[]>}
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
        "proxynova",
        "premproxy",
        "spys-one",
        "free-proxy-cz",
        /*
        "hidester",
        "checkerproxy",
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
