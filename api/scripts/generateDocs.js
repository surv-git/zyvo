/**
 * Generate OpenAPI Documentation
 * This script uses swagger-jsdoc to generate an OpenAPI 3.0.0 specification
 * from JSDoc comments in route files and saves it as YAML.
 */

const fs = require('fs');
const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');
const YAML = require('yamljs');

// Import swagger configuration
const swaggerOptions = require('../config/swaggerOptions');

/**
 * Generate OpenAPI specification and save as YAML file
 */
const generateDocs = async () => {
  try {
    console.log('📚 Generating OpenAPI documentation...');
    
    // Create docs directory if it doesn't exist
    const docsDir = path.join(__dirname, '../docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
      console.log('📁 Created docs directory');
    }
    
    // Generate OpenAPI specification
    const specs = swaggerJSDoc(swaggerOptions);
    
    // Convert to YAML format
    const yamlString = YAML.stringify(specs, 4);
    
    // Save to file
    const outputPath = path.join(docsDir, 'openapi.yaml');
    fs.writeFileSync(outputPath, yamlString);
    
    console.log('✅ OpenAPI specification generated successfully!');
    console.log(`📄 Saved to: ${outputPath}`);
    
    // Also save as JSON for reference
    const jsonPath = path.join(docsDir, 'openapi.json');
    fs.writeFileSync(jsonPath, JSON.stringify(specs, null, 2));
    console.log(`📄 JSON version saved to: ${jsonPath}`);
    
    // Display some statistics
    const endpoints = Object.keys(specs.paths || {});
    const totalEndpoints = endpoints.reduce((count, path) => {
      return count + Object.keys(specs.paths[path]).length;
    }, 0);
    
    console.log(`📊 Documentation Statistics:`);
    console.log(`   • ${endpoints.length} unique paths`);
    console.log(`   • ${totalEndpoints} total endpoints`);
    console.log(`   • ${Object.keys(specs.components?.schemas || {}).length} schemas defined`);
    console.log(`   • ${specs.tags?.length || 0} tags defined`);
    
    // Validation checks
    console.log('\n🔍 Validation Checks:');
    
    if (!specs.info?.title) {
      console.warn('⚠️  Warning: API title is missing');
    }
    
    if (!specs.info?.version) {
      console.warn('⚠️  Warning: API version is missing');
    }
    
    if (!specs.servers?.length) {
      console.warn('⚠️  Warning: No servers defined');
    }
    
    if (!specs.paths || Object.keys(specs.paths).length === 0) {
      console.warn('⚠️  Warning: No API paths found. Make sure your route files contain JSDoc comments.');
    }
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Run "npm run docs:build" to generate HTML documentation');
    console.log('2. Run "npm run docs:serve" to preview the documentation');
    console.log('3. Or run "npm run docs:full" to generate and build in one command');
    
  } catch (error) {
    console.error('❌ Error generating documentation:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure all route files have valid JSDoc comments');
    console.error('2. Check that file paths in swaggerOptions.js are correct');
    console.error('3. Verify that all referenced schemas are properly defined');
    
    if (error.stack) {
      console.error('\nFull error stack:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
};

/**
 * Watch mode for development
 * Re-generate docs when route files change
 */
const watchMode = () => {
  console.log('👀 Watching for changes in route files...');
  console.log('Press Ctrl+C to stop watching\n');
  
  const routesDir = path.join(__dirname, '../routes');
  
  if (fs.existsSync(routesDir)) {
    fs.watch(routesDir, { recursive: true }, (eventType, filename) => {
      if (filename && filename.endsWith('.js')) {
        console.log(`📝 File changed: ${filename}`);
        generateDocs();
      }
    });
  }
  
  // Initial generation
  generateDocs();
};

// Handle command line arguments
const args = process.argv.slice(2);
const isWatchMode = args.includes('--watch') || args.includes('-w');

if (isWatchMode) {
  watchMode();
} else {
  generateDocs();
}

module.exports = { generateDocs };
