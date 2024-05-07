const { parseHTML } = require("linkedom");

const headers = {
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "accept-language": "en-GB,en;q=0.5",
  "cache-control": "max-age=0",
  priority: "u=0, i",
  "sec-ch-ua": '"Chromium";v="124", "Brave";v="124", "Not-A.Brand";v="99"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "none",
  "sec-fetch-user": "?1",
  "sec-gpc": "1",
  "upgrade-insecure-requests": "1",
  cookie: "AC=C",
};

async function getResultStreamUrl(result) {
  const pageResponse = await fetch(
    `https://prehraj.to${result.detailPageUrl}`,
    {
      headers,
      referrerPolicy: "strict-origin-when-cross-origin",
      body: null,
      method: "GET",
    }
  );
  const pageHtml = await pageResponse.text();
  const { document } = parseHTML(pageHtml);

  const scriptEls = document.querySelectorAll("script");
  const scriptEl = [...scriptEls].find((el) =>
    el.textContent.includes("sources =")
  );
  const script = scriptEl.textContent;

  let file1 = "";
  let file2 = "";

  try {
    const fileRegex = /.*file: "(.*?)".*/s;
    const sourcesRegex = /.*var sources = \[(.*?);.*/s;
    const sources = sourcesRegex.exec(script)[1];
    const items = JSON.parse(`[${sources}]`);
    file1 = items.map((item) => fileRegex.exec(item)[1])[0];
  } catch (error) {
    const srcRegex = /.*src: "(.*?)".*/s;
    file1 = srcRegex.exec(script)[1];
  }

  try {
    const patternRegex = /.*var tracks = (.*?);.*/s;
    const scriptText = soup.querySelector("script").textContent;
    const data = JSON.parse(patternRegex.exec(scriptText)[1]);
    file2 = data[0].src;
  } catch (error) {
    file2 = "";
  }

  return file1 || file2;
}

async function getSearchResults(title) {
  const pageResponse = await fetch(
    `https://prehraj.to/hledej/${encodeURIComponent(title)}?vp-page=0`,
    {
      headers,
      referrerPolicy: "strict-origin-when-cross-origin",
      body: null,
      method: "GET",
    }
  );
  const pageHtml = await pageResponse.text();
  const { document } = parseHTML(pageHtml);
  const links = document.querySelectorAll("a.video--link");
  const results = [...links].map((linkEl) => {
    const sizeStr = linkEl
      .querySelector(".video__tag--size")
      .innerHTML.toUpperCase();
    const sizeNum = parseInt(sizeStr);
    const sizeMul = sizeStr.includes("KB")
      ? 1024
      : sizeStr.includes("MB")
      ? 1048576
      : sizeStr.includes("GB")
      ? 1073741824
      : 1;
    return {
      title: linkEl.getAttribute("title"),
      detailPageUrl: linkEl.getAttribute("href"),
      duration: linkEl.querySelector(".video__tag--time").innerHTML,
      format: linkEl
        .querySelector(".video__tag--format use")
        ?.getAttribute("xlink:href"), // TODO
      size: sizeNum * sizeMul,
    };
  });
  return results;
}

module.exports = { getSearchResults, getResultStreamUrl };
