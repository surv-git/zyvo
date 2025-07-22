const fs = require('fs');
const path = require('path');

const pages = [
  // Categories
  { path: 'categories/stats', title: 'Category Statistics', endpoint: '/api/v1/categories/stats', description: 'Get category statistics and performance metrics' },
  
  // Brands
  { path: 'brands', title: 'Brands', endpoint: '/api/v1/brands', description: 'Create a new brand, Get all brands with filtering and pagination' },
  { path: 'brands/stats', title: 'Brand Statistics', endpoint: '/api/v1/brands/stats', description: 'Get brand statistics and performance metrics' },
  
  // Product Variants
  { path: 'product-variants', title: 'Product Variants', endpoint: '/api/v1/product-variants', description: 'Get all product variants with filtering and pagination, Create a new product variant' },
  { path: 'product-variants/stats', title: 'Product Variant Statistics', endpoint: '/api/v1/product-variants/stats', description: 'Get product variant statistics and performance metrics' },
  
  // Options
  { path: 'options', title: 'Options', endpoint: '/api/v1/options', description: 'Create a new option, Get all options with filtering and pagination' },
  
  // Platforms
  { path: 'platforms', title: 'Platforms', endpoint: '/api/v1/platforms', description: 'Create a new platform, Get all platforms with filtering and pagination' },
  
  // Inventory
  { path: 'inventory', title: 'Inventory Management', endpoint: '/api/v1/inventory', description: 'Create inventory record, Get all inventory records' },
  
  // Listings
  { path: 'listings', title: 'Listings', endpoint: '/api/v1/listings', description: 'Create a new listing, Get all listings' },
  
  // Reviews
  { path: 'reviews', title: 'Reviews Management', endpoint: '/api/v1/reviews', description: 'Get all reviews, Create a new review' },
  { path: 'reviews/approve', title: 'Approve Reviews', endpoint: '/api/v1/admin/reviews/{reviewId}/approve', description: 'Approve pending reviews' },
  { path: 'reviews/reject', title: 'Reject Reviews', endpoint: '/api/v1/admin/reviews/{reviewId}/reject', description: 'Reject inappropriate reviews' },
  { path: 'reviews/report', title: 'Report Reviews', endpoint: '/api/v1/admin/reviews/{reviewId}/report', description: 'Report problematic reviews' },
  
  // Settings & Reports
  { path: 'settings', title: 'System Settings', endpoint: '/api/v1/admin/settings', description: 'Update system settings and configuration' },
  { path: 'reports/sales', title: 'Sales Reports', endpoint: '/api/v1/admin/reports/sales', description: 'Export sales data and analytics' },
  { path: 'health', title: 'Health Check', endpoint: '/api/v1/admin/health', description: 'System health monitoring and diagnostics' },
];

function createPageComponent(title, endpoint, description) {
  return `export default function ${title.replace(/[^a-zA-Z0-9]/g, '')}Page() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">${title}</h1>
          <p className="text-muted-foreground mt-2">
            ${description}
          </p>
        </div>
      </div>
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">${title}</h3>
        <p className="text-muted-foreground">
          API Endpoint: <code className="bg-muted px-2 py-1 rounded">${endpoint}</code>
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          ${description}
        </p>
      </div>
    </div>
  );
}`;
}

// Create all pages
pages.forEach(page => {
  const dirPath = path.join(__dirname, 'src', 'app', page.path);
  const filePath = path.join(dirPath, 'page.tsx');
  
  // Create directory if it doesn't exist
  fs.mkdirSync(dirPath, { recursive: true });
  
  // Create page file
  const content = createPageComponent(page.title, page.endpoint, page.description);
  fs.writeFileSync(filePath, content);
  
  console.log(`Created: ${filePath}`);
});

console.log('All pages created successfully!');
