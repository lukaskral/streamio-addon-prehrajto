const {
  getSearchResults,
  getResultStreamUrls,
} = require("./src/service/fastshare");
const { timeToSeconds } = require("./src/utils/convert");

+(async function test() {
  console.log(timeToSeconds("1:00:10"));
})();
