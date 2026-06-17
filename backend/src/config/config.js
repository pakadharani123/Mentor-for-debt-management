require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/debt-guidance-db',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_key_antigravity_platform_987654321',
  jwtExpire: process.env.JWT_EXPIRE || '30d',
  aiProvider: process.env.AI_PROVIDER || 'mock',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || ''
};
