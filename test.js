const { getResolver } = require("./src/service/prehrajto");

+(async function test() {
  const resolver = getResolver({
    userName: "monarcha@seznam,cz",
    password: "Q5qčxy9eCfWf",
  });
  await resolver.init();
  const results = await resolver.search("amelie");
  console.log("Results", results.length);
  const first = await resolver.resolve(results[0]);
  console.log(first);
})();
