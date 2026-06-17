const https = require('https');
const config = require('./src/config/config');

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${config.geminiApiKey}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response body:', data);
  });
}).on('error', (err) => {
  console.error('HTTPS Error:', err.message);
});
