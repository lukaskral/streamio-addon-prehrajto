/**
 *
 * @param {string} word
 * @returns
 */
function normalizeString(word) {
  return word
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replaceAll(/[^a-zA-Z0-9]+/g, " ");
}

module.exports = { normalizeString };
