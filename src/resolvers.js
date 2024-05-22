const {
  getSearchResults: getPrehrajtoSearchResults,
  getResultStreamUrls: getPrehrajtoStreamUrls,
} = require("./service/prehrajto");
const {
  getSearchResults: getFastshareSearchResults,
  getResultStreamUrls: getFastshareStreamUrls,
} = require("./service/fastshare");

/**
 * @typedef {{
 *  title: string;
 *  detailPageUrl:string;
 *  duration: string;
 *  format?: string;
 *  size:number;
 * }} SearchResult
 */

/**
 * @typedef {SearchResult & {
 *  video: string;
 *  subtitles?: string[];
 * }} StreamResult
 */

/**
 * @typedef {{
 *  search: (title: string) => SearchResult[];
 *  resolve: (SearchResult) => StreamResult;
 * }} Resolver
 */

/** @type {Resolver} */
const resolvers = [];
