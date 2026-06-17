const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./src/config/config');

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

async function run() {
  try {
    // There is no direct listModels on the genAI class in some versions, 
    // but we can try to fetch them or test gemini-pro / gemini-1.5-pro / gemini-1.0-pro
    console.log('Testing gemini-pro...');
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const res = await model.generateContent('Hello');
    console.log('Success with gemini-pro:', res.response.text());
  } catch (err) {
    console.error('Failed with gemini-pro:', err.message);
  }

  try {
    console.log('Testing gemini-1.5-pro...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const res = await model.generateContent('Hello');
    console.log('Success with gemini-1.5-pro:', res.response.text());
  } catch (err) {
    console.error('Failed with gemini-1.5-pro:', err.message);
  }
}

run();
