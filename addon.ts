import { readFileSync } from "fs";
import type { ContentType, Manifest } from "stremio-addon-sdk";
import SDK from "stremio-addon-sdk";

import { getTopItems,type Resolver } from "./src/getTopItems.ts";
import { initResolvers } from "./src/initResolvers.ts";
import { getMeta } from "./src/meta.ts";
import { getImdbDetails } from "./src/service/imdb.ts";
import {
  type UserConfigData,
  userConfigDef,
} from "./src/userConfig/userConfig.ts";
import { bytesToSize } from "./src/utils/convert.ts";

function getManifest() {
  const pkgData = readFileSync("./package.json", "utf8");
  const pkg = JSON.parse(pkgData);
  return {
    id: "community.czstreams",
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
  } satisfies Manifest;
}

const builder = new SDK.addonBuilder(getManifest());
export let activeResolvers: Resolver[] = [];

builder.defineStreamHandler(async (props) => {
  const { type, id, config } = props as {
    type: ContentType;
    id: string;
    config: UserConfigData;
  };
  try {
    const [baseMeta, csMeta] = await Promise.all([
      getMeta(type, id),
      getImdbDetails(id, "cs"),
    ]);

    const meta = {
      ...baseMeta,
      names: {
        en: baseMeta.name,
        cs: csMeta?.alternateName,
      },
    };

    if (!activeResolvers.length) {
      activeResolvers = (await initResolvers()).filter((r) => r !== null);
    }

    const topItems = await getTopItems(meta, activeResolvers, config);

    const streams = topItems.map((item) => ({
      url: item.video,
      name: `${item.resolverName}, (${bytesToSize(item.size)})`,
      description: item.title,
      subtitles: item.subtitles ?? undefined,
      behaviorHints: {
        videoSize: item.size,
        bingeGroup: `${item.resolverName}-${item.resolverId}`,
        ...(item.behaviorHints ?? {}),
        filename: item.title,
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

export const addonInterface = builder.getInterface();
