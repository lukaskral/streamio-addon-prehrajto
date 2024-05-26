/**
 * Extract cookies from response
 * @param {Response} result
 * @returns
 */
function extractCookies(result) {
  const cookies = result.headers
    .getSetCookie()
    .map((cookie) => {
      const parts = cookie.split(";");
      const [name, value] = parts[0].split("=");
      return { name, value };
    })
    .filter((cookie) => cookie.value.toLowerCase() !== "deleted");

  return cookies;
}

function headerCookies(cookies) {
  return {
    cookie: cookies.map(({ name, value }) => `${name}=${value}`).join("; "),
  };
}

module.exports = { extractCookies, headerCookies };
