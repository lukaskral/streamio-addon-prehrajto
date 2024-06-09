const { getResolver } = require("./src/service/prehrajto");

+(async function test() {
  const resolver = getResolver();
  await resolver.init();
  const results = await resolver.search("Joey S02E07");
  console.log("Results", results.length);
  if (results.length > 0) {
    const first = await resolver.resolve(results[0]);
    console.log(first);
  }
})();
