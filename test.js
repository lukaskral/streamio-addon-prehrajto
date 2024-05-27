const { getResolver } = require("./src/service/prehrajto");

+(async function test() {
  const resolver = getResolver();
  await resolver.init({
    userName: "monarcha@seznam,cz",
    password: "Q5qčxy9eCfWf",
  });
  const results = await resolver.search("amelie");
  const first = await resolver.resolve(results[0]);
  console.log(first);
})();
