const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./src/config/config');

console.log('GEMINI_API_KEY:', config.geminiApiKey ? 'Present (starts with ' + config.geminiApiKey.substring(0, 5) + '...)' : 'Missing');

const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

model.generateContent('Test connection')
  .then(res => {
    console.log('Success! Gemini response:', res.response.text());
  })
  .catch(err => {
    console.error('Failed to connect to Gemini Generative AI:', err);
  });
