const pkg = require("./package.json");
const { addonBuilder } = require("stremio-addon-sdk");
const { getMeta } = require("./src/meta");
const { getTopItems } = require("./src/getTopItems");

const { bytesToSize } = require("./src/utils/convert");
const { initResolvers } = require("./src/initResolvers");

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
    configurationRequired: false,
  },
  config: [
    {
      key: "pt_enabled",
      type: "checkbox",
      title: "PrehrajTo enabled",
    },
    {
      key: "pt_username",
      type: "text",
      title: "PrehrajTo username",
    },
    {
      key: "pt_password",
      type: "password",
      title: "PrehrajTo password",
    },
  ],
};

const builder = new addonBuilder(manifest);

builder.defineStreamHandler(async ({ type, id }) => {
  try {
    const meta = await getMeta(type, id);
    console.log("streamHandler", { type, id });

    const activeResolvers = await initResolvers();

    const topItems = await getTopItems(meta, activeResolvers);

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

const addonInterface = builder.getInterface();
const proxyInterface = {
  constructor: {
    name: "AddonInterface",
  },
  manifest: addonInterface.manifest,
  get: (...args) => {
    console.log("Addon interface", args);
    return addonInterface.get(...args);
  },
};
module.exports = proxyInterface;
