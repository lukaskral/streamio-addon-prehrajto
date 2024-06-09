function isOlder(maxAge, snapshotTime, nowTime = Date.now()) {
  const snapshotAge = nowTime - new Date(snapshotTime).getTime();
  return snapshotAge > maxAge;
}

module.exports = { isOlder };
