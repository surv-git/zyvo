# API Documentation with Redoc-CLI

This guide provides comprehensive instructions for generating and serving API documentation using redoc-cli with OpenAPI specifications.

## Overview

Our API documentation system uses:
- **swagger-jsdoc**: Generates OpenAPI 3.0.0 specifications from JSDoc comments
- **redoc-cli**: Generates beautiful static HTML documentation from OpenAPI specs
- **Custom scripts**: Automates the documentation generation process

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- `swagger-jsdoc` - OpenAPI spec generation
- `redoc-cli` - Static HTML documentation generator
- `yamljs` - YAML file handling

### 2. Generate OpenAPI Specification

```bash
npm run docs:generate
```

This command:
- Scans all route files for JSDoc comments
- Generates `docs/openapi.yaml` and `docs/openapi.json`
- Provides statistics about the generated documentation

### 3. Build HTML Documentation

```bash
npm run docs:build
```

This command:
- Uses redoc-cli to generate static HTML from the OpenAPI spec
- Creates `docs/index.html` with beautiful, interactive documentation

### 4. Generate and Build in One Command

```bash
npm run docs:full
```

This combines both generation and building steps.

### 5. Preview Documentation

```bash
npm run docs:serve
```

This starts a local server to preview the documentation at `http://localhost:8080`.

## Manual redoc-cli Usage

### Installation

If you need to install redoc-cli globally:

```bash
npm install -g redoc-cli
```

### Basic Commands

```bash
# Generate HTML documentation
redoc-cli build docs/openapi.yaml --output docs/index.html

# Serve documentation locally
redoc-cli serve docs/openapi.yaml

# Serve on a specific port
redoc-cli serve docs/openapi.yaml --port 8080

# Generate with custom options
redoc-cli build docs/openapi.yaml --output docs/index.html --options.theme.colors.primary.main="#FF6B6B"
```

### Advanced Options

```bash
# Generate with custom template
redoc-cli build docs/openapi.yaml --output docs/index.html --template custom-template.hbs

# Disable search functionality
redoc-cli build docs/openapi.yaml --output docs/index.html --options.disableSearch=true

# Set custom title
redoc-cli build docs/openapi.yaml --output docs/index.html --options.title="My API Documentation"
```

## Project Structure

```
/docs/
├── openapi.yaml          # Generated OpenAPI specification (YAML)
├── openapi.json          # Generated OpenAPI specification (JSON)
└── index.html           # Generated HTML documentation

/config/
└── swaggerOptions.js    # OpenAPI specification configuration

/scripts/
└── generateDocs.js      # Documentation generation script

/routes/
├── products.js          # Example routes with JSDoc comments
├── auth.js              # Authentication routes
└── ...                  # Other route files
```

## Writing JSDoc Comments

### Basic Route Documentation

```javascript
/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: Get all products
 *     description: Retrieve a paginated list of products
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
```

### Security Requirements

```javascript
/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     security:
 *       - bearerAuth: []
 *       - csrfToken: []
 *     # ... rest of the documentation
 */
```

### Schema References

```javascript
/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         price:
 *           type: number
 */
```

## Configuration

### Swagger Options (`config/swaggerOptions.js`)

The main configuration file defines:
- API metadata (title, version, description)
- Server URLs for different environments
- Security schemes (JWT, CSRF)
- Reusable components and schemas
- File paths to scan for JSDoc comments

### Environment Variables

Add to your `.env` file:

```bash
# API Documentation
API_DOCS_TITLE=Zyvo API Documentation
API_DOCS_VERSION=1.0.0
API_DOCS_DESCRIPTION=Comprehensive API documentation for Zyvo platform
```

## Serving Documentation

### Option 1: Static File Server

Add to your Express app:

```javascript
// Serve documentation as static files
app.use('/docs', express.static(path.join(__dirname, 'docs')));
```

Access documentation at: `http://localhost:3000/docs`

### Option 2: Dedicated Documentation Route

```javascript
// Serve documentation at a specific route
app.get('/api-docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'index.html'));
});
```

### Option 3: Nginx/Apache

For production, serve the `docs/index.html` file directly with your web server.

## Development Workflow

### 1. Write JSDoc Comments

Add comprehensive JSDoc comments to your route files:

```javascript
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
```

### 2. Generate Documentation

```bash
npm run docs:generate
```

### 3. Review Generated Spec

Check the generated `docs/openapi.yaml` file to ensure all endpoints are documented correctly.

### 4. Build HTML Documentation

```bash
npm run docs:build
```

### 5. Preview Documentation

```bash
npm run docs:serve
```

### 6. Commit and Deploy

Add the generated documentation to your repository and deploy.

## Watch Mode

For development, you can run the documentation generator in watch mode:

```bash
node scripts/generateDocs.js --watch
```

This will automatically regenerate the documentation when route files change.

## Customization

### Custom Themes

Create a custom theme by modifying the redoc-cli options:

```bash
redoc-cli build docs/openapi.yaml --output docs/index.html --options.theme.colors.primary.main="#FF6B6B"
```

### Custom Templates

Use a custom HTML template:

```bash
redoc-cli build docs/openapi.yaml --output docs/index.html --template custom-template.hbs
```

### Logo and Branding

Add your logo to the documentation:

```javascript
// In swaggerOptions.js
definition: {
  openapi: '3.0.0',
  info: {
    title: 'Zyvo API',
    'x-logo': {
      url: 'https://example.com/logo.png',
      altText: 'Zyvo Logo'
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **No endpoints found**
   - Check that JSDoc comments use `@swagger` tag
   - Verify file paths in `swaggerOptions.js`
   - Ensure route files are properly formatted

2. **Schema references not working**
   - Check that schemas are defined in `components/schemas`
   - Verify correct `$ref` syntax
   - Ensure proper indentation in YAML

3. **Documentation not updating**
   - Run `npm run docs:generate` after making changes
   - Check for syntax errors in JSDoc comments
   - Verify that route files are being scanned

### Debug Mode

Run the documentation generator with debugging:

```bash
DEBUG=swagger-jsdoc npm run docs:generate
```

### Validation

Use online validators to check your OpenAPI specification:
- [Swagger Editor](https://editor.swagger.io/)
- [OpenAPI Validator](https://apitools.dev/swagger-parser/online/)

## Best Practices

1. **Consistent Documentation**: Document all endpoints with the same level of detail
2. **Use Examples**: Include request/response examples for better understanding
3. **Security Documentation**: Always document authentication requirements
4. **Error Responses**: Document all possible error responses
5. **Schema Reuse**: Use `$ref` to reuse common schemas
6. **Tag Organization**: Group related endpoints with tags
7. **Version Control**: Include generated documentation in version control
8. **Regular Updates**: Update documentation when API changes

## Integration with CI/CD

Add documentation generation to your CI/CD pipeline:

```yaml
# .github/workflows/docs.yml
name: Generate API Documentation

on:
  push:
    branches: [main]

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Generate documentation
        run: npm run docs:full
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

This setup will automatically generate and deploy your documentation whenever you push to the main branch.
