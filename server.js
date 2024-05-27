#!/usr/bin/env node

const { serveHTTP, publishToCentral } = require("stremio-addon-sdk");
const addonInterface = require("./addon");

+(async () => {})();
serveHTTP(addonInterface, {
  port: process.env.PORT || 52932,
}).then(({ server, url }) => {
  server.on("request", (req, res) => {
    if (req.url === "/test") {
      res.send({ hello: "world" });
    }
  });
});
