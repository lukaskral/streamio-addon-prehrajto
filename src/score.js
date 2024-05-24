/** @typedef {import('./getTopItems.js').SearchResult} SearchResult */
/** @typedef {import('./meta.js').Meta} Meta */

/**
 * @param {Meta} meta
 * @param {SearchResult} searchResult
 * @returns
 */
function computeScore(meta, searchResult) {
  try {
    const runtime = parseInt(meta.runtime) * 60; // run time in seconds
    const resultRuntime = searchResult.duration;
    const runtimeScore =
      runtime && resultRuntime
        ? 1 - Math.abs(runtime - resultRuntime) / runtime
        : 0.8;

    const thresholdSize = resultRuntime * 75000; // 0.25GB/h
    const minSize = resultRuntime * 450000; // 1.5GB/h
    const maxSize = resultRuntime * 600000; // 2GB/h
    const resultSize = searchResult.size;
    const sizeScore =
      resultSize < thresholdSize
        ? 0
        : resultSize < minSize
          ? 1 - minSize / resultSize
          : resultSize > maxSize
            ? 1 - Math.min((maxSize / resultSize) * 0.1, 0.5)
            : 1;

    const yearScore = searchResult.title.includes(meta.released) ? 1.2 : 1;

    const requiredWords = meta.name
      .replaceAll(/[^a-zA-Z0-9]+/g, " ")
      .split(" ")
      .filter((word) => word.length >= 2);

    const titleScore = requiredWords.reduce(
      (score, word) =>
        score *
        (searchResult.title.includes(word)
          ? 1
          : 1 - 1 / (requiredWords.length + 1)),
      1,
    );

    return [titleScore, runtimeScore, sizeScore, yearScore].reduce(
      (ret, part) => ret * part,
      1,
    );
  } catch (e) {
    console.error(e);
    return 0.5;
  }
}

module.exports = { computeScore };
