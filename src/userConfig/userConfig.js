const userConfigDef = [
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
 *   prehrajtoUsername: string;
 *   prehrajtoPassword: string;
 * }} UserConfigData
 */

module.exports = { userConfigDef };
