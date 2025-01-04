const { getResolver: initFastshareResolver } = require("./service/fastshare");
const { getResolver: initHellspyResolver } = require("./service/hellspy");
const { getResolver: initPrehrajtoResolver } = require("./service/prehrajto");
const { getResolver: initSledujtetoResolver } = require("./service/sledujteto");
const { getResolver: initWebshareResolver } = require("./service/webshare");

/** @typedef {import('./getTopItems.js').Resolver} Resolver */

async function initResolvers() {
  /** @type {Resolver[]} */
  const resolvers = [
    //initFastshareResolver(),
    initHellspyResolver(),
    initPrehrajtoResolver(),
    //initSledujtetoResolver(),
    initWebshareResolver(),
  ];

  const activeResolvers = (
    await Promise.allSettled(
      resolvers.map(async (resolver) => {
        await resolver.prepare();
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
