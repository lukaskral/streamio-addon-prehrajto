async function getMeta(type, id) {
  let canonicalId = id;
  let filter = null;

  if (type === "series") {
    const parts = id.split(":");
    canonicalId = parts[0];
    filter = {
      season: parseInt(parts[1]),
      number: parseInt(parts[2]),
    };
  }

  const response = await fetch(
    "https://v3-cinemeta.strem.io/meta/" + type + "/" + canonicalId + ".json"
  );
  const data = (await response.json()).meta;

  if (filter) {
    data.episode = data.videos.find((video) =>
      Object.keys(filter).every((key) => filter[key] === video[key])
    );
  }

  return data;
}

module.exports = { getMeta };
