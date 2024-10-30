/**
 * @typedef {{
 *     awards:         string;
 *     cast:           string[];
 *     country:        string;
 *     description:    string;
 *     director:       string[];
 *     dvdRelease:     string;
 *     genre:          string[];
 *     imdbRating:     string;
 *     imdb_id:        string;
 *     moviedb_id:     number;
 *     name:           string;
 *     names:          Record<"en" | "cs", string>;
 *     popularity:     number;
 *     poster:         string;
 *     released:       string;
 *     runtime:        string;
 *     trailers:       Array<{
 *       source: string;
 *       type:   string;
 *     }>;
 *     type:           string;
 *     writer:         string[];
 *     year:           string;
 *     background:     string;
 *     logo:           string;
 *     popularities:   {
 *       moviedb:     number;
 *       stremio:     number;
 *       trakt:       number;
 *       stremio_lib: number;
 *     };
 *     slug:           string;
 *     id:             string;
 *     genres:         string[];
 *     releaseInfo:    string;
 *     trailerStreams: Array<{
 *       title: string;
 *       ytId:  string;
 *     }>;
 *     links:          Array<{
 *       name:     string;
 *       category: string;
 *       url:      string;
 *     }>;
 *     behaviorHints:  Array<{
 *       defaultVideoId:     string;
 *       hasScheduledVideos: boolean;
 *     }>;
 * }} Meta
 */

/**
 * @param {"movie" | "series"} type
 * @param {string} id
 * @returns Meta
 */

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
    "https://v3-cinemeta.strem.io/meta/" + type + "/" + canonicalId + ".json",
  );
  const data = (await response.json()).meta;

  if (filter) {
    data.episode = data.videos.find((video) =>
      Object.keys(filter).every((key) => filter[key] === video[key]),
    );
  }

  return data;
}

module.exports = { getMeta };
