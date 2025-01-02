const { normalizeString } = require("./utils/normalizeString");

/** @typedef {import('./getTopItems.js').SearchResult} SearchResult */
/** @typedef {import('./getTopItems.js').SearchDef} SearchDef */
/** @typedef {import('./meta.js').Meta} Meta */

const advantages = ["brrip", "bdrip", "webrip", "4k", "uhd", "2160p"];
const neutral = ["1080p", "hd", "h264", "h265", "avi"];
const disadvantages = ["camrip", "kinorip"];
const banned = ["trailer", "teaser"];

/**
 * @param {Meta} meta
 * @param {SearchResult} searchResult
 * @returns
 */
function computeScore(meta, searchResult) {
  try {
    const coefficients = [
      getTitleScore(meta, searchResult),
      getEpisodeScore(meta, searchResult),
      getYearScore(meta, searchResult),
      getRuntimeScore(meta, searchResult),
      getSizeScore(meta, searchResult),
      geKeywordsScore(meta, searchResult),
    ];

    searchResult.coef = coefficients;
    return coefficients.reduce((ret, part) => ret * part, 1);
  } catch (e) {
    console.error(e);
    return 0.5;
  }
}

function getTitleScore(meta, searchResult) {
  const normalizedResult = normalizeString(searchResult.title);
  const normalizedTitles = Object.values(meta.names)
    .filter((title) => typeof title === "string")
    .map((title) => normalizeString(title));

  const scores = normalizedTitles.map((normalizedSearchTitle) => {
    let titleScore = 1;

    if (normalizedResult.includes(normalizedSearchTitle)) {
      titleScore = 1.5;
    } else {
      const requiredWords = normalizedSearchTitle.split(" ");
      titleScore = requiredWords.reduce(
        (score, word) => score * (normalizedResult.includes(word) ? 1 : 0.7),
        titleScore,
      );
    }
    return titleScore;
  });

  const titleScore = Math.max(...scores);
  return titleScore > 0.3 ? titleScore : 0;
}

function getEpisodeScore(meta, searchResult) {
  const normalizedResult = normalizeString(searchResult.title);
  if ("episode" in meta && meta.episode) {
    try {
      const episodeRegex = /\ss?(\d+)[ex](\d+)(?:\s|$)/gim;
      const result = episodeRegex.exec(normalizedResult);
      if (result) {
        const season = parseInt(result[1]);
        const episode = parseInt(result[2]);
        if (meta.episode.season === season && meta.episode.number === episode) {
          return 1.3;
        }
      }
    } catch (error) {
      // nothing to do
    }
    // episode number not found, remove from results
    return 0;
  }

  return 1;
}

function getYearScore(meta, searchResult) {
  const normalizedResult = normalizeString(searchResult.title);
  try {
    const yearRegex = /\s((?:19|20)\d{2})(?:\s|$)/gim;
    const year = yearRegex.exec(normalizedResult)?.[1];
    if (year == meta.released) {
      return 1.3;
    } else {
      return 0.8;
    }
  } catch (error) {
    return 1;
  }
}

function getRuntimeScore(meta, searchResult) {
  const runtime = parseInt(meta.runtime) * 60; // run time in seconds
  const resultRuntime = searchResult.duration;
  return runtime && resultRuntime
    ? 1 - Math.abs(runtime - resultRuntime) / runtime
    : 0.8;
}

function getSizeScore(meta, searchResult) {
  const runtime = parseInt(meta.runtime) * 60; // run time in seconds

  const thresholdSize = runtime * 75000; // 0.25GB/h
  const minSize = runtime * 450000; // 1.5GB/h
  const maxSize = runtime * 600000; // 2GB/h
  const resultSize = searchResult.size;

  if (!resultSize) {
    return 1;
  }
  if (resultSize < thresholdSize) {
    return 0.1;
  }
  if (resultSize < minSize) {
    return 0.9;
  }
  if (resultSize > maxSize) {
    return 0.9;
  }
  return 1;
}

function geKeywordsScore(meta, searchResult) {
  let score = 1;
  const normalizedTitle = normalizeString(searchResult.title);

  advantages.forEach((word) => {
    if (normalizedTitle.includes(word)) {
      score = score * 1.1;
    }
  });
  disadvantages.forEach((word) => {
    if (normalizedTitle.includes(word)) {
      score = score * 0.9;
    }
  });
  banned.forEach((word) => {
    if (normalizedTitle.includes(word)) {
      score = score * 0.1;
    }
  });
  return score;
}

module.exports = { computeScore };
