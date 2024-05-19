const { HttpsProxyAgent } = require("https-proxy-agent");
const { SocksProxyAgent } = require("socks-proxy-agent");
//var ProxyLists = require("proxy-lists");
const { getSearchResults } = require("./prehrajto");

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
