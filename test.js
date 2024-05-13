const { getMeta } = require("./src/meta");
const { getTopItems } = require("./src/getTopItems");
const { getProxies, filterAlive } = require("./src/proxy");

+(async function test() {
  const proxies = await getProxies();
  const aliveProxies = await filterAlive(proxies);
  console.log(aliveProxies);
  //  const meta = await getMeta("movie", "tt1254207");
  //  const links = await getTopItems(meta);
})();
