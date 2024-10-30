function deduplicateByProp(arr, propName) {
  return Object.values(
    Object.fromEntries(arr.map((item) => [item[propName], item])),
  );
}

module.exports = { deduplicateByProp };
