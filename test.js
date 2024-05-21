const { getSearchResults, getResultStreamUrls } = require("./src/fastshare");

+(async function test() {
  const results = await getSearchResults("Mad Max Fury Road");

  console.log(
    await Promise.all(
      results.map(async (d) => ({ ...d, ...(await getResultStreamUrls(d)) }))
    )
  );
})();
