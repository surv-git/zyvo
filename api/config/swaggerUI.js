/**
 * Swagger UI Setup for Interactive API Documentation
 * This provides full "Try it out" functionality
 */

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerOptions = require('./swaggerOptions');

/**
 * Setup Swagger UI with custom configuration for better interactivity
 */
const setupSwaggerUI = (app) => {
  // Generate OpenAPI spec
  const specs = swaggerJSDoc(swaggerOptions);
  
  // Swagger UI options for maximum interactivity
  const swaggerUiOptions = {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
      requestInterceptor: (request) => {
        // Add CSRF token if available
        const csrfToken = document.querySelector('meta[name="csrf-token"]');
        if (csrfToken) {
          request.headers['X-CSRF-Token'] = csrfToken.getAttribute('content');
        }
        return request;
      }
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0 }
      .swagger-ui .scheme-container { 
        background: #fafafa; 
        padding: 20px; 
        border-radius: 4px; 
        margin: 20px 0; 
      }
      .swagger-ui .btn.authorize { 
        background-color: #3b82f6; 
        border-color: #3b82f6; 
      }
      .swagger-ui .btn.authorize:hover { 
        background-color: #2563eb; 
        border-color: #2563eb; 
      }
    `,
    customSiteTitle: "Zyvo API Documentation",
    customfavIcon: "/favicon.ico"
  };

  // Serve Swagger UI
  app.use('/swagger', swaggerUi.serve);
  app.get('/swagger', swaggerUi.setup(specs, swaggerUiOptions));

  // Also serve at /api-docs/swagger for consistency
  app.get('/api-docs/swagger', swaggerUi.setup(specs, swaggerUiOptions));

  console.log('📚 Swagger UI available at:');
  console.log('   • http://localhost:3000/swagger');
  console.log('   • http://localhost:3000/api-docs/swagger');
};

module.exports = { setupSwaggerUI };
