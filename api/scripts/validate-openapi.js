#!/usr/bin/env node

/**
 * OpenAPI Documentation Validator
 * Validates the OpenAPI specification and generates a comprehensive report
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateOpenAPISpec() {
  const specPath = path.join(__dirname, '../docs/openapi.yaml');
  
  if (!fs.existsSync(specPath)) {
    log('❌ OpenAPI specification file not found!', 'red');
    return false;
  }

  try {
    // Load and parse YAML
    const specContent = fs.readFileSync(specPath, 'utf8');
    const spec = yaml.load(specContent);
    
    log('🎉 OpenAPI Specification Validation Report', 'bold');
    log('=' .repeat(50), 'cyan');
    
    // Basic structure validation
    validateBasicStructure(spec);
    
    // Schema validation
    validateSchemas(spec);
    
    // Paths validation
    validatePaths(spec);
    
    // Security validation
    validateSecurity(spec);
    
    // Tags validation
    validateTags(spec);
    
    // Generate summary
    generateSummary(spec);
    
    return true;
    
  } catch (error) {
    log(`❌ Error parsing OpenAPI specification: ${error.message}`, 'red');
    return false;
  }
}

function validateBasicStructure(spec) {
  log('\n📋 Basic Structure Validation', 'blue');
  
  const requiredFields = ['openapi', 'info', 'servers', 'components', 'paths'];
  const results = [];
  
  requiredFields.forEach(field => {
    if (spec[field]) {
      results.push(`✅ ${field}: Present`);
    } else {
      results.push(`❌ ${field}: Missing`);
    }
  });
  
  results.forEach(result => log(`  ${result}`));
  
  // Info validation
  if (spec.info) {
    log(`  📝 Title: ${spec.info.title}`);
    log(`  📝 Version: ${spec.info.version}`);
    log(`  📝 Description: ${spec.info.description ? 'Present' : 'Missing'}`);
  }
  
  // Servers validation
  if (spec.servers && spec.servers.length > 0) {
    log(`  🌐 Servers: ${spec.servers.length} configured`);
    spec.servers.forEach((server, index) => {
      log(`    ${index + 1}. ${server.url} (${server.description || 'No description'})`);
    });
  }
}

function validateSchemas(spec) {
  log('\n🏗️  Schema Validation', 'blue');
  
  if (!spec.components || !spec.components.schemas) {
    log('  ❌ No schemas found!', 'red');
    return;
  }
  
  const schemas = spec.components.schemas;
  const schemaCount = Object.keys(schemas).length;
  
  log(`  📊 Total Schemas: ${schemaCount}`, 'green');
  
  // Critical e-commerce schemas
  const criticalSchemas = [
    'User', 'Product', 'Category', 'Cart', 'CartItem', 
    'Order', 'OrderItem', 'Address', 'Favorite', 
    'ProductReview', 'Wallet', 'WalletTransaction'
  ];
  
  log('\n  🎯 Critical E-commerce Schemas:');
  criticalSchemas.forEach(schemaName => {
    if (schemas[schemaName]) {
      const schema = schemas[schemaName];
      const requiredFields = schema.required ? schema.required.length : 0;
      const properties = schema.properties ? Object.keys(schema.properties).length : 0;
      log(`    ✅ ${schemaName}: ${properties} properties, ${requiredFields} required`, 'green');
    } else {
      log(`    ❌ ${schemaName}: Missing`, 'red');
    }
  });
  
  // Additional schemas
  const additionalSchemas = Object.keys(schemas).filter(name => !criticalSchemas.includes(name));
  if (additionalSchemas.length > 0) {
    log('\n  📋 Additional Schemas:');
    additionalSchemas.forEach(schemaName => {
      log(`    ✅ ${schemaName}`, 'cyan');
    });
  }
}

function validatePaths(spec) {
  log('\n🛣️  Endpoint Validation', 'blue');
  
  if (!spec.paths) {
    log('  ❌ No paths found!', 'red');
    return;
  }
  
  const paths = spec.paths;
  const pathCount = Object.keys(paths).length;
  
  log(`  📊 Total Endpoints: ${pathCount}`, 'green');
  
  // Group by HTTP methods
  const methodCounts = {};
  const tagCounts = {};
  
  Object.keys(paths).forEach(pathKey => {
    const pathObj = paths[pathKey];
    Object.keys(pathObj).forEach(method => {
      if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
        methodCounts[method.toUpperCase()] = (methodCounts[method.toUpperCase()] || 0) + 1;
        
        const operation = pathObj[method];
        if (operation.tags) {
          operation.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      }
    });
  });
  
  log('\n  📈 HTTP Methods Distribution:');
  Object.keys(methodCounts).forEach(method => {
    log(`    ${method}: ${methodCounts[method]} endpoints`, 'cyan');
  });
  
  // Critical endpoints validation
  const criticalEndpoints = [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/products',
    '/api/v1/cart',
    '/api/v1/orders',
    '/api/v1/favorites'
  ];
  
  log('\n  🎯 Critical Endpoints:');
  criticalEndpoints.forEach(endpoint => {
    if (paths[endpoint]) {
      const methods = Object.keys(paths[endpoint]).filter(m => 
        ['get', 'post', 'put', 'patch', 'delete'].includes(m)
      );
      log(`    ✅ ${endpoint}: ${methods.join(', ').toUpperCase()}`, 'green');
    } else {
      log(`    ❌ ${endpoint}: Missing`, 'red');
    }
  });
}

function validateSecurity(spec) {
  log('\n🔐 Security Validation', 'blue');
  
  if (!spec.components || !spec.components.securitySchemes) {
    log('  ❌ No security schemes found!', 'red');
    return;
  }
  
  const securitySchemes = spec.components.securitySchemes;
  
  log(`  📊 Security Schemes: ${Object.keys(securitySchemes).length}`, 'green');
  
  Object.keys(securitySchemes).forEach(schemeName => {
    const scheme = securitySchemes[schemeName];
    log(`    ✅ ${schemeName}: ${scheme.type} (${scheme.scheme || scheme.in || 'N/A'})`, 'cyan');
  });
  
  // Check for JWT authentication
  const hasJWT = Object.values(securitySchemes).some(scheme => 
    scheme.type === 'http' && scheme.scheme === 'bearer'
  );
  
  if (hasJWT) {
    log('  ✅ JWT Authentication: Configured', 'green');
  } else {
    log('  ⚠️  JWT Authentication: Not found', 'yellow');
  }
}

function validateTags(spec) {
  log('\n🏷️  Tags Validation', 'blue');
  
  if (!spec.tags) {
    log('  ❌ No tags defined!', 'red');
    return;
  }
  
  const tags = spec.tags;
  log(`  📊 Total Tags: ${tags.length}`, 'green');
  
  // Critical tags for e-commerce
  const criticalTags = [
    'Authentication', 'Users', 'Products', 'Categories',
    'Cart', 'Orders', 'Favorites', 'Wallet'
  ];
  
  log('\n  🎯 Critical Tags:');
  criticalTags.forEach(tagName => {
    const tag = tags.find(t => t.name === tagName);
    if (tag) {
      log(`    ✅ ${tagName}: ${tag.description || 'No description'}`, 'green');
    } else {
      log(`    ❌ ${tagName}: Missing`, 'red');
    }
  });
  
  // Additional tags
  const additionalTags = tags.filter(t => !criticalTags.includes(t.name));
  if (additionalTags.length > 0) {
    log('\n  📋 Additional Tags:');
    additionalTags.forEach(tag => {
      log(`    ✅ ${tag.name}: ${tag.description || 'No description'}`, 'cyan');
    });
  }
}

function generateSummary(spec) {
  log('\n📊 Documentation Summary', 'bold');
  log('=' .repeat(50), 'cyan');
  
  const schemaCount = spec.components?.schemas ? Object.keys(spec.components.schemas).length : 0;
  const pathCount = spec.paths ? Object.keys(spec.paths).length : 0;
  const tagCount = spec.tags ? spec.tags.length : 0;
  const securitySchemeCount = spec.components?.securitySchemes ? 
    Object.keys(spec.components.securitySchemes).length : 0;
  
  // Count total operations
  let operationCount = 0;
  if (spec.paths) {
    Object.values(spec.paths).forEach(pathObj => {
      operationCount += Object.keys(pathObj).filter(method => 
        ['get', 'post', 'put', 'patch', 'delete'].includes(method)
      ).length;
    });
  }
  
  log(`📋 Schemas: ${schemaCount}`, 'green');
  log(`🛣️  Endpoints: ${pathCount}`, 'green');
  log(`⚡ Operations: ${operationCount}`, 'green');
  log(`🏷️  Tags: ${tagCount}`, 'green');
  log(`🔐 Security Schemes: ${securitySchemeCount}`, 'green');
  
  // Calculate completeness score
  const maxScore = 100;
  let score = 0;
  
  // Schema completeness (30 points)
  const criticalSchemas = ['User', 'Product', 'Category', 'Cart', 'Order'];
  const presentSchemas = criticalSchemas.filter(name => 
    spec.components?.schemas?.[name]
  ).length;
  score += (presentSchemas / criticalSchemas.length) * 30;
  
  // Endpoint completeness (40 points)
  const criticalEndpoints = ['/api/v1/auth/login', '/api/v1/products', '/api/v1/cart', '/api/v1/orders'];
  const presentEndpoints = criticalEndpoints.filter(endpoint => 
    spec.paths?.[endpoint]
  ).length;
  score += (presentEndpoints / criticalEndpoints.length) * 40;
  
  // Security completeness (20 points)
  if (securitySchemeCount > 0) score += 20;
  
  // Documentation completeness (10 points)
  if (spec.info?.description && tagCount > 5) score += 10;
  
  const scoreColor = score >= 90 ? 'green' : score >= 70 ? 'yellow' : 'red';
  log(`\n🎯 Completeness Score: ${Math.round(score)}/100`, scoreColor);
  
  if (score >= 90) {
    log('🎉 Excellent! Your API documentation is comprehensive.', 'green');
  } else if (score >= 70) {
    log('👍 Good! Consider adding more schemas and endpoints.', 'yellow');
  } else {
    log('⚠️  Needs improvement. Add critical schemas and endpoints.', 'red');
  }
  
  log('\n✅ Validation Complete!', 'bold');
}

// Run validation
if (require.main === module) {
  validateOpenAPISpec();
}

module.exports = { validateOpenAPISpec };
