async function getProxies() {
  const result = await fetch(
    "https://api.proxyscrape.com/v3/free-proxy-list/get?request=getproxies&country=cz&skip=0&proxy_format=protocolipport&format=json&limit=15",
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-GB,en;q=0.9",
        priority: "u=1, i",
        "sec-ch-ua":
          '"Chromium";v="124", "Brave";v="124", "Not-A.Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "sec-gpc": "1",
        Referer: "https://proxyscrape.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: null,
      method: "GET",
    }
  );
  const proxies = (await result.json()).proxies ?? [];
  return proxies;
}

module.exports = { getProxies };
