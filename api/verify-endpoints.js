/**
 * Endpoint Verification Script
 * Verifies that all v1 API endpoints are properly registered
 */

const express = require('express');

// Import route files
const productRoutes = require('./routes/product.routes');
const optionRoutes = require('./routes/option.routes');
const productVariantRoutes = require('./routes/productVariant.routes');
const categoryRoutes = require('./routes/category.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const authRoutes = require('./routes/auth.routes');

function getRouteInfo(router) {
  const routes = [];
  
  if (router.stack) {
    router.stack.forEach(layer => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods);
        routes.push({
          path: layer.route.path,
          methods: methods.filter(method => method !== '_all')
        });
      }
    });
  }
  
  return routes;
}

console.log('🔍 Verifying API v1 Endpoints\n');

// Check Product routes
console.log('📦 PRODUCT ROUTES (/api/v1/products):');
const productRouteInfo = getRouteInfo(productRoutes);
productRouteInfo.forEach(route => {
  console.log(`  ${route.methods.join(', ').toUpperCase()} ${route.path}`);
});

// Check Option routes  
console.log('\n⚙️  OPTION ROUTES (/api/v1/options):');
const optionRouteInfo = getRouteInfo(optionRoutes);
optionRouteInfo.forEach(route => {
  console.log(`  ${route.methods.join(', ').toUpperCase()} ${route.path}`);
});

// Check ProductVariant routes
console.log('\n🏷️  PRODUCT VARIANT ROUTES (/api/v1/product-variants):');
const variantRouteInfo = getRouteInfo(productVariantRoutes);
variantRouteInfo.forEach(route => {
  console.log(`  ${route.methods.join(', ').toUpperCase()} ${route.path}`);
});

// Check Category routes
console.log('\n📂 CATEGORY ROUTES (/api/v1/categories):');
const categoryRouteInfo = getRouteInfo(categoryRoutes);
categoryRouteInfo.forEach(route => {
  console.log(`  ${route.methods.join(', ').toUpperCase()} ${route.path}`);
});

// Check User routes
console.log('\n👤 USER ROUTES (/api/v1/users):');
const userRouteInfo = getRouteInfo(userRoutes);
userRouteInfo.forEach(route => {
  console.log(`  ${route.methods.join(', ').toUpperCase()} ${route.path}`);
});

// Check Auth routes
console.log('\n🔐 AUTH ROUTES (/api/v1/auth):');
const authRouteInfo = getRouteInfo(authRoutes);
authRouteInfo.forEach(route => {
  console.log(`  ${route.methods.join(', ').toUpperCase()} ${route.path}`);
});

// Check Admin routes
console.log('\n🛡️  ADMIN ROUTES (/api/v1/admin):');
const adminRouteInfo = getRouteInfo(adminRoutes);
adminRouteInfo.forEach(route => {
  console.log(`  ${route.methods.join(', ').toUpperCase()} ${route.path}`);
});

console.log('\n✅ Verification complete!');
console.log('\n📚 OpenAPI Documentation available at:');
console.log('   - /api-docs (Redoc)');
console.log('   - /docs/openapi.yaml (Raw OpenAPI spec)');
