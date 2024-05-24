const { getResolver } = require("./src/service/zalohujsi");

+(async function test() {
  const resolver = getResolver();
  const results = await resolver.search("amelie");
  const first = await resolver.resolve(results[0]);
  console.log(first);
})();
