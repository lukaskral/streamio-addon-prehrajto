const pkg = require("./package.json");
const { addonBuilder } = require("stremio-addon-sdk");
const { getMeta } = require("./src/meta");
const { getTopItems } = require("./src/getTopItems");

const { bytesToSize } = require("./src/utils/convert");
const { initResolvers } = require("./src/initResolvers");
const { userConfigDef } = require("./src/userConfig/userConfig");
const { getImdbDetails } = require("./src/service/imdb");

const manifest = {
  id: "community.prehrajto",
  version: pkg.version,
  catalogs: [],
  resources: ["stream"],
  types: ["movie", "series"],
  name: "CzStreams",
  description: "",
  idPrefixes: ["tt"],
  logo: "https://play-lh.googleusercontent.com/qDMsLq4DWg_OHEX6YZvM1FRKnSmUhzYH-rYbWi4QBosX9xTDpO8hRUC-oPtNt6hoFX0=w256-h256-rw",
  behaviorHints: {
    configurable: true,
    configurationRequired: true,
  },
  config: userConfigDef,
};

const builder = new addonBuilder(manifest);
let activeResolvers = [];

builder.defineStreamHandler(async ({ type, id, config }) => {
  try {
    const [baseMeta, csMeta] = await Promise.all([
      getMeta(type, id),
      getImdbDetails(id, "cs"),
    ]);

    const meta = {
      ...baseMeta,
      names: {
        en: baseMeta.name,
        cs: csMeta.alternateName,
      },
    };
    console.log({ id, names: meta.names });

    if (!activeResolvers.length) {
      activeResolvers = await initResolvers();
    }

    const topItems = await getTopItems(meta, activeResolvers, config);

    const streams = topItems.map((item) => ({
      url: item.video,
      name: `${item.resolverName}: ${item.title} (${bytesToSize(item.size)})`,
      subtitles: item.subtitles ?? undefined,
      behaviorHints: {
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

(async function init() {
  activeResolvers = await initResolvers();
})();

const addonInterface = builder.getInterface();

module.exports = { addonInterface, activeResolvers };
