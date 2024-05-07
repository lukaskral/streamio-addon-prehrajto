const { getSearchResults, getResultStreamUrl } = require("./prehrajto");

async function getTopItems(meta) {
  let links = [];
  if (meta.episode) {
    links = await getSearchResults(
      `${meta.name} s${String(meta.episode.season).padStart(2, "0")}e${String(
        meta.episode.number
      ).padStart(2, "0")}`
    );
  } else {
    links = await getSearchResults(meta.name);
  }

  const results = (
    await Promise.allSettled(
      (links.length > 5 ? links.slice(0, 5) : links).map(async (link) => ({
        ...link,
        streamUrl: await getResultStreamUrl(link),
      }))
    )
  )
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);
  return results;
}

module.exports = { getTopItems };
