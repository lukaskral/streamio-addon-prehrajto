const { HttpsProxyAgent } = require("https-proxy-agent");
const { getProxies, filterAlive } = require("./proxy");

async function getFetchConfig() {
  const proxyList = await filterAlive(await getProxies());
  if (proxyList.length > 0) {
    const proxyDetail = proxyList[0];
    const agent = new HttpsProxyAgent(proxyDetail.proxy);
    return { agent };
  }
  return {};
}

module.exports = { getFetchConfig };
