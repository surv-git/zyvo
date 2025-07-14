#!/usr/bin/env node

/**
 * Setup Script for Zyvo API Documentation
 * This script helps set up the API documentation system
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Zyvo API Documentation System...\n');

// Check if dependencies are installed
console.log('📦 Checking dependencies...');
try {
  require('swagger-jsdoc');
  require('redoc-cli');
  console.log('✅ All dependencies are installed\n');
} catch (error) {
  console.log('❌ Some dependencies are missing. Installing...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully\n');
  } catch (installError) {
    console.error('❌ Failed to install dependencies:', installError.message);
    process.exit(1);
  }
}

// Create docs directory if it doesn't exist
const docsDir = path.join(__dirname, '../docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
  console.log('📁 Created docs directory');
} else {
  console.log('📁 Docs directory already exists');
}

// Generate initial documentation
console.log('\n📚 Generating initial documentation...');
try {
  execSync('npm run docs:generate', { stdio: 'inherit' });
  console.log('✅ OpenAPI specification generated successfully');
} catch (error) {
  console.error('❌ Failed to generate documentation:', error.message);
  console.log('ℹ️  This might be because route files don\'t have JSDoc comments yet');
}

// Build HTML documentation
console.log('\n🏗️  Building HTML documentation...');
try {
  execSync('npm run docs:build', { stdio: 'inherit' });
  console.log('✅ HTML documentation built successfully');
} catch (error) {
  console.error('❌ Failed to build HTML documentation:', error.message);
  console.log('ℹ️  Make sure the OpenAPI specification was generated first');
}

// Check if documentation was created
const htmlDocsPath = path.join(docsDir, 'index.html');
if (fs.existsSync(htmlDocsPath)) {
  console.log('\n🎉 Documentation setup complete!');
  console.log('\n📖 Next steps:');
  console.log('1. Start your API server: npm run dev');
  console.log('2. View documentation at: http://localhost:3000/docs');
  console.log('3. Or serve docs directly: npm run docs:serve');
  console.log('4. Add JSDoc comments to your routes for better documentation');
} else {
  console.log('\n⚠️  Documentation setup partially complete');
  console.log('📖 To complete setup:');
  console.log('1. Add JSDoc comments to your route files');
  console.log('2. Run: npm run docs:full');
  console.log('3. Start your server: npm run dev');
  console.log('4. View documentation at: http://localhost:3000/docs');
}

console.log('\n📋 Available commands:');
console.log('• npm run docs:generate - Generate OpenAPI specification');
console.log('• npm run docs:build - Build HTML documentation');
console.log('• npm run docs:serve - Serve documentation locally');
console.log('• npm run docs:full - Generate and build in one command');

console.log('\n📚 Documentation:');
console.log('• Setup guide: docs/README.md');
console.log('• Example routes: routes/products.js');
console.log('• Configuration: config/swaggerOptions.js');

console.log('\n🔧 Troubleshooting:');
console.log('• If documentation is empty, add JSDoc comments to your routes');
console.log('• Check the console output for any errors during generation');
console.log('• Verify file paths in config/swaggerOptions.js');

console.log('\n✨ Happy documenting!');
