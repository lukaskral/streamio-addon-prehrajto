const { HttpsProxyAgent } = require("https-proxy-agent");
const { getProxies, filterAlive } = require("./proxy");

async function getFetchConfig() {
  try {
    const proxyList = await filterAlive(await getProxies());
    if (proxyList.length > 0) {
      const proxyDetail = proxyList[0];
      const agent = new HttpsProxyAgent(proxyDetail.proxy);
      console.info("fetchProxy", proxyDetail.proxy);
      return { agent };
    }
    return {};
  } catch (e) {
    console.error("getFetchConfig", e);
    return {};
  }
}

module.exports = { getFetchConfig };
