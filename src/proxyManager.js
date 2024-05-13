const { getProxies, getProxyAgent, filterAlive } = require("./proxy.js");

/**
 * @typedef {import('./proxy.js').ProxyDetails} ProxyDetails
 */

class ProxyManager {
  /** @type {null | NodeJS.Timeout} */
  timeout = null;

  /** @type {null | string} */
  currentProxyDetails = null;

  /** @type {string} */
  testUrl = "https://prehraj.to/";

  constructor() {
    this.periodic();
  }

  schedule() {
    const periodic = () => this.periodic();
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
    if (
      !this.currentProxyDetails ||
      !(await testProxy(this.currentProxyDetails))
    ) {
      await this.renew();
    }
    this.schedule();
  }

  async renew() {
    console.log("proxy: renew");
    try {
      const proxies = await getProxies();
      console.log("proxy: scraped list", proxies);
      const aliveProxies = await filterAlive(proxies);
      console.log("proxy: filtered list", aliveProxies);
      if (aliveProxies.length) {
        this.currentProxyDetails = aliveProxies[0];
      }
      console.log(`proxy: using "${this.currentProxyDetails}"`);
    } catch (e) {
      console.log(e);
      this.currentProxyDetails = null;
      console.log("proxy: not found");
    }
  }

  get fetchOptions() {
    const options = {};
    if (this.currentProxyDetails) {
      options.agent = getProxyAgent(this.currentProxyDetails.proxy);
    }
    return options;
  }
}

module.exports = { ProxyManager };
