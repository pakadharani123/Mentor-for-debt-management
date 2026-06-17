const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./src/config/config');

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

async function run() {
  try {
    console.log('Testing gemini-2.0-flash...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const res = await model.generateContent('Hello');
    console.log('Success with gemini-2.0-flash:', res.response.text());
  } catch (err) {
    console.error('Failed with gemini-2.0-flash:', err.message);
  }
}

run();
