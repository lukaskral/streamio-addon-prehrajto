const { getMeta } = require("./src/meta");
const { getTopItems } = require("./src/prehrajto");
const { getProxies } = require("./src/proxy");

+(async function test() {
  const proxies = await getProxies();
  console.log(proxies);
  const meta = await getMeta("movie", "tt1254207");
  console.log(meta);
  const links = await getTopItems(meta);
  console.log(links);
})();
