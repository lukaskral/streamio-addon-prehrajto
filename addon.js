const { addonBuilder } = require("stremio-addon-sdk");
const { getMeta } = require("./src/meta");
const { getTopItems } = require("./src/getTopItems");
const {
  getResolver: initPrehrajtoResolver,
} = require("./src/service/prehrajto");
const {
  getResolver: initFastshareResolver,
} = require("./src/service/fastshare");
const { bytesToSize } = require("./src/utils/convert");

const manifest = {
  id: "community.prehrajto",
  version: "0.0.9",
  catalogs: [],
  resources: ["stream"],
  types: ["movie", "series"],
  name: "Prehraj.to",
  description: "",
  idPrefixes: ["tt"],
  logo: "https://play-lh.googleusercontent.com/qDMsLq4DWg_OHEX6YZvM1FRKnSmUhzYH-rYbWi4QBosX9xTDpO8hRUC-oPtNt6hoFX0=w256-h256-rw",
};

const builder = new addonBuilder(manifest);

/** @typedef {import('./getTopItems.js').Resolver} Resolver */

builder.defineStreamHandler(async ({ type, id }) => {
  try {
    /** @type {Resolver[]} */
    const resolvers = [
      initPrehrajtoResolver({
        userName: "monarcha@seznam,cz",
        password: "Q5qčxy9eCfWf",
      }),
      // initFastshareResolver(),
    ];

    const meta = await getMeta(type, id);
    console.log("streamHandler", { type, id });

    const topItems = await getTopItems(meta, resolvers);

    const streams = topItems.map((item) => ({
      url: item.video,
      name: `${item.resolverName} ${bytesToSize(item.size)}`,
      subtitles: item.subtitles ?? undefined,
      behaviorHints: {
        bingeGroup: `prehrajTo-${item.format}`,
        videoSize: item.size,
      },
    }));
    return {
      streams,
    };
  } catch (e) {
    console.error(e);
    // otherwise return no streams
    return { streams: [] };
  }
});

module.exports = builder.getInterface();
