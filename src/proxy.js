const { HttpsProxyAgent } = require("https-proxy-agent");

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
async function getProxies() {
  const proxies = [{ proxy: "http://109.238.219.225:4153" }];
  return proxies;
  /*
  const result = await fetch(
    "https://api.proxyscrape.com/v3/free-proxy-list/get?request=getproxies&country=cz&skip=0&proxy_format=protocolipport&format=json&limit=15&anonymity=Anonymous,Elite",
    {
      headers: {
        accept: "application/json, text/plain",
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
  */
}

/**
 *
 * @param {ProxyDetails[]} proxies
 * @param {string?} testUrl
 */
async function filterAlive(proxies, testUrl = "https://prehraj.to/") {
  return (
    await Promise.allSettled(
      proxies.map(async (proxyDetails) => {
        const proxyAgent = new HttpsProxyAgent(proxyDetails.proxy);
        const response = await fetch(testUrl, {
          agent: proxyAgent,
          signal: AbortSignal.timeout(60_000),
        });
        return response.ok ? proxyDetails : false;
      })
    )
  )
    .map((result) => {
      return result;
    })
    .filter((result) => result.status === "fulfilled" && result.value)
    .map((result) => result.value);
}

module.exports = { getProxies, filterAlive };
