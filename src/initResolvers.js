const { getResolver: initPrehrajtoResolver } = require("./service/prehrajto");
const { getResolver: initFastshareResolver } = require("./service/fastshare");
const { getResolver: initZalohujsiResolver } = require("./service/zalohujsi");

/** @typedef {import('./getTopItems.js').Resolver} Resolver */

async function initResolvers() {
  /** @type {Resolver[]} */
  const resolvers = [
    initPrehrajtoResolver(),
    // initFastshareResolver(),
    initZalohujsiResolver(),
  ];

  const activeResolvers = (
    await Promise.allSettled(
      resolvers.map(async (resolver) => {
        await resolver.init();
        return resolver;
      }),
    )
  )
    .map((r) => (r.status === "fulfilled" && r.value ? r.value : null))
    .filter((r) => Boolean(r));
  return activeResolvers;
}

module.exports = { initResolvers };
