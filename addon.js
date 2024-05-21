const { addonBuilder } = require("stremio-addon-sdk");
const { getMeta } = require("./src/meta");
const { getTopItems } = require("./src/getTopItems");
const { login } = require("./src/prehrajto");

const manifest = {
  id: "community.prehrajto",
  version: "0.0.8",
  catalogs: [],
  resources: ["stream"],
  types: ["movie", "series"],
  name: "Prehraj.to",
  description: "",
  idPrefixes: ["tt"],
  logo: "https://play-lh.googleusercontent.com/qDMsLq4DWg_OHEX6YZvM1FRKnSmUhzYH-rYbWi4QBosX9xTDpO8hRUC-oPtNt6hoFX0=w256-h256-rw",
};

const builder = new addonBuilder(manifest);

builder.defineStreamHandler(async ({ type, id }) => {
  try {
    const fetchOptions = await login("monarcha@seznam,cz", "Q5qčxy9eCfWf");

    const meta = await getMeta(type, id);
    console.log("streamHandler", { type, id });

    const links = await getTopItems(meta, fetchOptions);
    console.log("topItems", links.length);

    const streams = links.map((link) => ({
      url: link.streamUrls.video,
      name: link.title,
      subtitles: link.streamUrls.subtitles ?? undefined,
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
