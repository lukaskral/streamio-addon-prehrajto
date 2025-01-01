const { normalizeString } = require("./utils/normalizeString");

/** @typedef {import('./getTopItems.js').SearchResult} SearchResult */
/** @typedef {import('./meta.js').Meta} Meta */

const advantages = ["brrip", "bdrip", "webrip", "4k"];
const neutral = ["1080p", "hd", "h264", "h265", "avi"];
const disadvantages = ["camrip", "kinorip"];
const banned = ["trailer", "teaser"];

/**
 * @param {Meta} meta
 * @param {string} searchTerm
 * @param {SearchResult} searchResult
 * @returns
 */
function computeScore(meta, searchTerm, searchResult) {
  try {
    const coefficients = [
      getTitleScore(meta, searchTerm, searchResult),
      getYearScore(meta, searchTerm, searchResult),
      getRuntimeScore(meta, searchTerm, searchResult),
      getSizeScore(meta, searchTerm, searchResult),
    ];

    return coefficients.reduce((ret, part) => ret * part, 1);
  } catch (e) {
    console.error(e);
    return 0.5;
  }
}

function getTitleScore(meta, searchTerm, searchResult) {
  const normalizedTitle = normalizeString(searchResult.title);
  const normalizedSearchTerm = normalizeString(searchTerm);

  let titleScore = 1;

  if (normalizedTitle.includes(normalizedSearchTerm)) {
    titleScore = 1.5;
  } else {
    const requiredWords = normalizedSearchTerm
      .split(" ")
      .filter((word) => word.length >= 2);

    titleScore = requiredWords.reduce(
      (score, word) =>
        score *
        (normalizedTitle.includes(word)
          ? 1
          : 1 - 1 / (requiredWords.length + 1)),
      titleScore,
    );
  }

  advantages.forEach((word) => {
    if (normalizedTitle.includes(word)) {
      titleScore = titleScore * 1.1;
    }
  });
  disadvantages.forEach((word) => {
    if (normalizedTitle.includes(word)) {
      titleScore = titleScore * 0.9;
    }
  });
  banned.forEach((word) => {
    if (normalizedTitle.includes(word)) {
      titleScore = titleScore * 0.1;
    }
  });
  return titleScore;
}

function getYearScore(meta, searchTerm, searchResult) {
  try {
    const yearRegex = /\s((?:19|20)\d{2})(?:\s|$)/gim;
    const year = yearRegex.exec(searchResult)?.[1];
    if (year == meta.released) {
      return 1.2;
    } else {
      return 0.8;
    }
  } catch (error) {
    return 1;
  }
}

function getRuntimeScore(meta, searchTerm, searchResult) {
  const runtime = parseInt(meta.runtime) * 60; // run time in seconds
  const resultRuntime = searchResult.duration;
  return runtime && resultRuntime
    ? 1 - Math.abs(runtime - resultRuntime) / runtime
    : 0.8;
}

function getSizeScore(meta, searchTerm, searchResult) {
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

module.exports = { computeScore };
