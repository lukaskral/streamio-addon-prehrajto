import { getResolver as getFastshareResolver } from "./service/fastshare.ts";
import { getResolver as getHellspyResolver } from "./service/hellspy.ts";
import { getResolver as getPrehrajtoResolver } from "./service/prehrajto.ts";
import { getResolver as getSledujtetoResolver } from "./service/sledujteto.ts";
import { getResolver as getWebshareResolver } from "./service/webshare.ts";

/** @typedef {import('./getTopItems.js').Resolver} Resolver */

export async function initResolvers() {
  /** @type {Resolver[]} */
  const resolvers = [
    getFastshareResolver(),
    getHellspyResolver(),
    getPrehrajtoResolver(),
    getSledujtetoResolver(),
    getWebshareResolver(),
  ];

  const activeResolvers = (
    await Promise.allSettled(
      resolvers.map(async (resolver) => ({
        resolver,
        initialized: await resolver.init(),
      })),
    )
  )
    .map((r) =>
      r.status === "fulfilled" && r.value && r.value.initialized
        ? r.value.resolver
        : null,
    )
    .filter((r) => Boolean(r));
  return activeResolvers;
}
