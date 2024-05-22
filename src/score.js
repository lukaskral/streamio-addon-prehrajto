/** @typedef {import('./getTopItems.js').SearchResult} SearchResult */
/** @typedef {import('./meta.js').Meta} Meta */

/**
 * @param {Meta} meta
 * @param {SearchResult} searchResult
 * @returns
 */
function computeScore(meta, searchResult) {
  const runtime = parseInt(meta.runtime) * 60; // run time in seconds
  const resultRuntime = searchResult.duration;
  const runtimeScore = 1 - Math.abs(runtime - resultRuntime) / runtime;

  const minSize = resultRuntime * 450000; // 1.5GB/h
  const maxSize = resultRuntime * 600000; // 2GB/h
  const resultSize = searchResult.size;
  const sizeScore =
    resultSize < minSize
      ? 1 - minSize / resultSize
      : resultSize > maxSize
        ? 1 - (maxSize / resultSize) * 0.1
        : 1;

  const yearScore = searchResult.title.includes(meta.released) ? 1.2 : 1;

  return [runtimeScore, sizeScore, yearScore].reduce(
    (ret, part) => ret * Math.max(part, 0.5),
    1,
  );
}

module.exports = { computeScore };
