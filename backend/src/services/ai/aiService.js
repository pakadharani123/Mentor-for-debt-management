const config = require('../../config/config');
const MockProvider = require('./MockProvider');
const OpenAIProvider = require('./OpenAIProvider');
const GeminiProvider = require('./GeminiProvider');

class AIService {
  /**
   * Instantiates the provider specified in configuration
   * Falls back to MockProvider if configuration is incorrect or keys are missing.
   */
  static getProvider() {
    let selectedProvider = (config.aiProvider || '').toLowerCase();
    const hasGemini = !!config.geminiApiKey;
    const hasOpenAI = !!config.openaiApiKey;

    let finalProvider = 'mock';

    if (selectedProvider === 'gemini') {
      if (hasGemini) {
        finalProvider = 'gemini';
      } else if (hasOpenAI) {
        console.warn('Gemini provider was selected but GEMINI_API_KEY is missing. Switching to OpenAI because OPENAI_API_KEY is available.');
        finalProvider = 'openai';
      } else {
        console.warn('Gemini provider was selected but GEMINI_API_KEY is missing. Falling back to MockProvider.');
        finalProvider = 'mock';
      }
    } else if (selectedProvider === 'openai') {
      if (hasOpenAI) {
        finalProvider = 'openai';
      } else if (hasGemini) {
        console.warn('OpenAI provider was selected but OPENAI_API_KEY is missing. Switching to Gemini because GEMINI_API_KEY is available.');
        finalProvider = 'gemini';
      } else {
        console.warn('OpenAI provider was selected but OPENAI_API_KEY is missing. Falling back to MockProvider.');
        finalProvider = 'mock';
      }
    } else {
      // Config is mock, or invalid
      if (hasGemini) {
        console.warn('AI_PROVIDER is set to mock (or not specified), but GEMINI_API_KEY is available. Automatically upgrading to Gemini Provider.');
        finalProvider = 'gemini';
      } else if (hasOpenAI) {
        console.warn('AI_PROVIDER is set to mock (or not specified), but OPENAI_API_KEY is available. Automatically upgrading to OpenAI Provider.');
        finalProvider = 'openai';
      } else {
        finalProvider = 'mock';
      }
    }

    switch (finalProvider) {
      case 'openai':
        return new OpenAIProvider();
      case 'gemini':
        return new GeminiProvider();
      case 'mock':
      default:
        return new MockProvider();
    }
  }
}

module.exports = AIService;
