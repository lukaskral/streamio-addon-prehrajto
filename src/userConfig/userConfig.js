const userConfigDef = [
  {
    key: "webshareUsername",
    type: "text",
    title: "WebshareCz username",
    required: false,
  },
  {
    key: "websharePassword",
    type: "password",
    title: "WebshareCz password",
    required: false,
  },
  {
    key: "prehrajtoUsername",
    type: "text",
    title: "PrehrajTo username",
    required: false,
  },
  {
    key: "prehrajtoPassword",
    type: "password",
    title: "PrehrajTo password",
    required: false,
  },
];

/**
 * @typedef {{
 *   webshareUsername: string;
 *   websharePassword: string;
 *   prehrajtoUsername: string;
 *   prehrajtoPassword: string;
 * }} UserConfigData
 */

module.exports = { userConfigDef };
