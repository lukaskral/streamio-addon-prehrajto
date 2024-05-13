const { addonBuilder } = require("stremio-addon-sdk");
const { getMeta } = require("./src/meta");
const { getTopItems } = require("./src/getTopItems");
const { getFetchConfig } = require("./src/fetchConfig");

// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md
const manifest = {
  id: "community.prehrajto",
  version: "0.0.3",
  catalogs: [],
  resources: ["stream"],
  types: ["movie", "series"],
  name: "Prehraj.to",
  description: "",
  idPrefixes: ["tt"],
  logo: "https://github.com/lukaskral/stremio-addon-prehrajto/blob/main/static/logo.png?raw=true",
};
const builder = new addonBuilder(manifest);

builder.defineStreamHandler(async ({ type, id }) => {
  try {
    const fetchOptions = await getFetchConfig();

    const meta = await getMeta(type, id);
    console.log("streamHandler", { type, id });

    const links = await getTopItems(meta, fetchOptions);
    console.log("topItems", links.length);

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
    console.error(e);
    // otherwise return no streams
    return { streams: [] };
  }
});

module.exports = builder.getInterface();
