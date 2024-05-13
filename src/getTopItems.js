const { getSearchResults, getResultStreamUrls } = require("./prehrajto");

async function getTopItems(meta, fetchOptions) {
  let links = [];
  if (meta.episode) {
    links = await getSearchResults(
      `${meta.name} s${String(meta.episode.season).padStart(2, "0")}e${String(
        meta.episode.number
      ).padStart(2, "0")}`,
      fetchOptions
    );
  } else {
    links = await getSearchResults(meta.name, fetchOptions);
  }

  console.info("getTopItems, topLinks", links.length);

  const results = (
    await Promise.allSettled(
      (links.length > 5 ? links.slice(0, 5) : links).map(async (link) => {
        try {
          const streamUrls = await getResultStreamUrls(link, fetchOptions);
          return {
            ...link,
            streamUrls,
          };
        } catch (e) {
          console.error(e);
          return { link, streamUrls: {} };
        }
      })
    )
  )
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);
  return results;
}

module.exports = { getTopItems };
