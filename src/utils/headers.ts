export const headers = {
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
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

type Headers = Record<string, string>;

export type FetchOptions = {
  headers?: Headers;
};

export default headers;
