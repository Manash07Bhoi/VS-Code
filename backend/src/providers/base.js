/**
 * CodeSense AI — AI provider adapter interface.
 *
 * The application domain depends on this interface, not on a vendor SDK.
 * Providers are configuration-controlled, never client-controlled.
 */

class ProviderAdapter {
  constructor(config = {}) {
    this.name = config.name || 'base';
    this.timeoutMs = config.timeoutMs || 60000;
    this.maxRetries = config.maxRetries || 2;
  }

  // Returns { findings: [...], summary, limitationNotice, provider, model }
  async analyze({ source, language, promptVersion }) {
    throw new Error('analyze() not implemented by provider adapter');
  }
}

module.exports = { ProviderAdapter };
