const { HttpsProxyAgent } = require("https-proxy-agent");
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
      countries: ["cz"],
      anonymityLevels: ["elite"],
    })
      .on("data", (items) => {
        // Received some proxies.
        proxies.push(...items);
      })
      .once("end", () => {
        // Done getting proxies.
        resolve(proxies);
      });
  });

  return proxies;
}

/**
 * @param {ProxyDetails} proxies
 * @param {string?} testUrl
 */
async function testProxy(proxyDetails, testUrl) {
  const proxyAgent = new HttpsProxyAgent(proxyDetails.proxy);
  const response = await fetch(testUrl, {
    agent: proxyAgent,
    signal: AbortSignal.timeout(60_000),
  });
  return response.ok ? proxyDetails : false;
}

/**
 * @param {ProxyDetails[]} proxies
 * @param {string?} testUrl
 */
async function filterAlive(proxies, testUrl = "https://prehraj.to/") {
  return (
    await Promise.allSettled(
      proxies.map((proxyDetails) => testProxy(proxyDetails, testUrl))
    )
  )
    .map((result) => {
      return result;
    })
    .filter((result) => result.status === "fulfilled" && result.value)
    .map((result) => result.value);
}

module.exports = { getProxies, filterAlive, testProxy };
