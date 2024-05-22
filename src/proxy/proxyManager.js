const { getProxies, getProxyAgent, testProxy } = require("./proxy.js");
const staticProxyList = require("../../static/proxyList.js");

/**
 * @typedef {"unknown" | "online" | "offline"} Status
 */

/**
 * @typedef {{
 *   url: string;
 *   status: Status
 * }} ProxyDetail
 */

class ProxyManager {
  /** @type {null | NodeJS.Timeout} */
  timeout = null;

  /** @type {null | string} */
  currentProxyDetails = null;

  /** @type {ProxyDetail[]} */
  list = [];

  lastDiscovered = 0;

  constructor() {
    this.lastDiscovered = Date.now();
    this.list = staticProxyList.map((url) => ({
      url,
      status: "unknown",
    }));
    this.periodic();
    this.discover().then(() => {
      if (!this.currentProxyDetails) {
        this.periodic();
      }
    });
  }

  schedule() {
    this.timeout = setTimeout(() => this.periodic(), 30_000);
  }

  destructor() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  async periodic() {
    console.log("proxy: check");

    if (this.shouldDiscover()) {
      await this.discover();
    }

    if (
      !this.currentProxyDetails ||
      !(await testProxy(this.currentProxyDetails))
    ) {
      if (this.currentProxyDetails) {
        console.log(`proxy: "${this.currentProxyDetails}" is offline`);
        this.setStatus(this.currentProxyDetails, "offline");
      } else {
        console.log(`proxy: no proxy configured`);
      }
      await this.renew();
    }
    this.schedule();
  }

  async discover() {
    console.log("proxy: discover");
    try {
      const proxies = await getProxies();
      this.lastDiscovered = Date.now();
      proxies.forEach((proxyString) => {
        const exists = this.list.find((item) => item.url === proxyString);
        if (!exists) {
          console.log(`proxy: new unknown "${proxyString}"`);
          this.list.push({
            url: proxyString,
            status: "unknown",
          });
        }
      });
    } catch (e) {
      console.log(e);
      console.log("proxy: discovery failed");
    }
  }

  /**
   * @param {Status} status
   * @returns {string | undefined}
   */
  getFirstByStatus(status) {
    const item = this.list.find((item) => item.status === status);
    if (item) {
      return item.url;
    }
    return undefined;
  }

  /**
   *
   * @param {string} proxyString
   * @param {Status} status
   */
  setStatus(proxyString, status) {
    if (!proxyString) {
      return;
    }
    console.log(`proxy: ${proxyString} is ${status}`);
    this.list = [
      ...this.list.map((item) =>
        item.url === proxyString
          ? {
              ...item,
              status,
            }
          : item,
      ),
    ];
  }

  shouldDiscover() {
    const usableProxies = this.list.filter((proxy) =>
      ["unknown", "online"].includes(proxy.status),
    );
    return (
      usableProxies.length === 0 || Date.now() - 600_000 > this.lastDiscovered
    );
  }

  async renew() {
    console.log("proxy: renew");
    try {
      let unknownProxy;
      while ((unknownProxy = this.getFirstByStatus("online"))) {
        if (await testProxy(unknownProxy)) {
          this.currentProxyDetails = unknownProxy;
          console.log(`proxy: using "${this.currentProxyDetails}"`);
          return;
        } else {
          this.setStatus(unknownProxy, "offline");
        }
      }

      while ((unknownProxy = this.getFirstByStatus("unknown"))) {
        if (await testProxy(unknownProxy)) {
          this.currentProxyDetails = unknownProxy;
          console.log(`proxy: using "${this.currentProxyDetails}"`);
          return;
        } else {
          this.setStatus(unknownProxy, "offline");
        }
      }
    } catch (e) {
      console.log(e);
    }
    this.currentProxyDetails = null;
    console.log("proxy: not found");
  }

  get fetchOptions() {
    const options = {};
    if (this.currentProxyDetails) {
      options.agent = getProxyAgent(this.currentProxyDetails);
    }

    options.headers = {
      "X-Forwarded-For": "212.20.115.66",
    };
    return options;
  }
}

module.exports = { ProxyManager };
