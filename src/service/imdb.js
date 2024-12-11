const { parseHTML } = require("linkedom");

const headers = {
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "accept-language": "en-GB,en;q=0.5",
  "cache-control": "max-age=0",
  priority: "u=0, i",
  "sec-ch-ua": '"Brave";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "none",
  "sec-fetch-user": "?1",
  "sec-gpc": "1",
  "upgrade-insecure-requests": "1",
  cookie: "AC=C",
  Referer: "https://prehraj.to/",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

async function getImdbDetails(id, languageCode = "cs") {
  const imdbId = id.split(":").at(0);
  try {
    const pageResponse = await fetch(`https://www.imdb.com/title/${imdbId}/`, {
      headers: {
        ...headers,
        "accept-language": `${languageCode};q=1.0, en;q=0.5`,
        "x-forwarded-for": "147.251.0.0", // todo find address range for given country
      },
      method: "GET",
    });
    const pageHtml = await pageResponse.text();
    const { document } = parseHTML(pageHtml);
    const scriptEls = document.querySelectorAll(
      "script[type='application/ld+json']",
    );
    const scriptEl = [...scriptEls].at(0);
    const data = JSON.parse(scriptEl.textContent);
    return data;
  } catch (e) {
    return undefined;
  }
}

module.exports = { getImdbDetails };
