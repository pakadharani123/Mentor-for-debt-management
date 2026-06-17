const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middleware/errorMiddleware');
const { standardLimiter } = require('./middleware/rateLimitMiddleware');
const path = require('path');
const routes = require('./routes');
const { translate } = require('./utils/localizer');

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors());

// Body parser, parsing JSON and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply standard rate limiter to all api routes
app.use('/api', standardLimiter);

// Serve Swagger specification
app.get('/swagger.json', (req, res) => {
  res.sendFile(path.join(__dirname, '../swagger.json'));
});

// Render interactive Swagger UI docs page
app.get('/api-docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>API Documentation - AI Debt Guidance</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
      <style>
        body { margin: 0; padding: 0; background: #fafafa; }
      </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
      <script>
        window.onload = () => {
          window.ui = SwaggerUIBundle({
            url: '/swagger.json',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis
            ],
            layout: "BaseLayout"
          });
        };
      </script>
    </body>
    </html>
  `);
});

// API Routes
app.use('/api', routes);

// Base root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the AI Debt Management & Financial Guidance Platform APIs.',
    docs: '/api-docs'
  });
});

// Catch-all 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: translate(req, 'resource_not_found')
  });
});

// Centralized error handler middleware
app.use(errorHandler);

module.exports = app;
