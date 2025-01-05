#!/usr/bin/env node

import SDK from "stremio-addon-sdk";

import { addonInterface } from "./addon.ts";

SDK.serveHTTP(addonInterface, {
  port: process.env.PORT ? Number(process.env.PORT) : 52932,
});

/*.then(({ server, url }) => {
  server.on("request", (req, res) => {
    if (req.url === "/test") {
      res.send({ hello: "world" });
    }
  });
});*/
