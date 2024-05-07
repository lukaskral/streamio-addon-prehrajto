const { addonBuilder } = require("stremio-addon-sdk");
const { getMeta } = require("./src/meta");
const { getTopItems } = require("./src/getTopItems");

// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md
const manifest = {
  id: "community.prehrajto",
  version: "0.0.1",
  catalogs: [],
  resources: ["stream"],
  types: ["movie", "series"],
  name: "Prehraj.to",
  description: "",
  idPrefixes: ["tt"],
  logo: "/static/logo.png",
};
const builder = new addonBuilder(manifest);

builder.defineStreamHandler(async ({ type, id }) => {
  try {
    const meta = await getMeta(type, id);
    const links = await getTopItems(meta);
    const streams = links.map((link) => ({
      url: link.streamUrl,
      name: link.title,
      subtitles: [], // TODO
      behaviorHints: {
        bingeGroup: `prehrajTo-${link.format}`,
        videoSize: link.size,
      },
    }));
    return {
      streams,
    };
  } catch (e) {
    console.warn(e);
    // otherwise return no streams
    return { streams: [] };
  }
});

module.exports = builder.getInterface();
