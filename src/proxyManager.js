const { HttpsProxyAgent } = require("https-proxy-agent");
const { getProxies } = require("./proxy.js");

/**
 * @typedef {import('./proxy.js').ProxyDetails} ProxyDetails
 */

class ProxyManager {
  /** @type {null | NodeJS.Timeout} */
  timeout = null;

  /** @type {null | ProxyDetails} */
  currentProxyDetails = null;

  /** @type {string} */
  testUrl = "https://prehraj.to/";

  constructor() {
    this.periodic();
  }

  schedule() {
    const periodic = () => this.periodic();
    this.timeout = setTimeout(periodic, 300_000);
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
      const aliveProxies = await filterAlive(proxies);
      this.currentProxyDetails = aliveProxies[0];
      console.log(`proxy: using "${this.currentProxyDetails}"`);
    } catch (e) {
      this.currentProxyDetails = null;
      console.log("proxy: not found");
    }
  }

  get fetchOptions() {
    const options = {};
    if (this.currentProxyDetails) {
      options.agent = new HttpsProxyAgent(this.currentProxyDetails.proxy);
    }
    return options;
  }
}

module.exports = { ProxyManager };
