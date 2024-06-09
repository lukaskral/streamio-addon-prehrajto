#!/usr/bin/env node

const { serveHTTP, publishToCentral } = require("stremio-addon-sdk");
const { addonInterface, activeResolvers } = require("./addon");

+(async () => {})();
serveHTTP(addonInterface, {
  port: process.env.PORT || 52932,
}).then(({ server, url }) => {
  server.on("request", (req, res) => {
    if (req.url === "/test") {
      res.send({ hello: "world" });
    }
    if (req.url === "/db") {
      return activeResolvers
        .find((r) => r.resolverName === "PrehrajTo")
        .stats()
        .then((e) => res.send(e));
    }
  });
});
