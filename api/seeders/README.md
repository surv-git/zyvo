# Database Seeder Documentation

A comprehensive database seeding system for the Zyvo API that handles table dependencies, data generation, and cleanup operations.

## Overview

The seeder system provides:
- **Independent seeding**: Seed specific tables individually
- **Dependency management**: Automatically handles table dependencies
- **Realistic data**: Uses Faker.js for generating realistic test data
- **Flexible operations**: Seed, clean, and status checking
- **Error handling**: Comprehensive error handling with helpful messages

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Environment

```bash
cp .env.example .env
# Edit .env with your MongoDB connection string
```

### 3. Basic Usage

```bash
# Check database status
npm run db:status

# Seed all tables (respects dependencies)
npm run seed:all

# Seed specific tables
npm run seed:users
npm run seed:products
npm run seed:orders

# Clean all tables
npm run clean:all

# Reset database (clean and seed)
npm run db:reset
```

## Command Reference

### NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run seed` | Show seeder help |
| `npm run seed:users` | Seed users table |
| `npm run seed:products` | Seed products table |
| `npm run seed:orders` | Seed orders table |
| `npm run seed:all` | Seed all tables in dependency order |
| `npm run clean:users` | Clean users table |
| `npm run clean:products` | Clean products table |
| `npm run clean:orders` | Clean orders table |
| `npm run clean:all` | Clean all tables in reverse dependency order |
| `npm run db:status` | Show database status |
| `npm run db:reset` | Clean and seed all tables |

### Direct Commands

```bash
# Seed operations
node seeders/seeder.js seed users
node seeders/seeder.js seed products
node seeders/seeder.js seed orders
node seeders/seeder.js seed all

# Clean operations
node seeders/seeder.js clean users
node seeders/seeder.js clean products
node seeders/seeder.js clean orders
node seeders/seeder.js clean all

# Status and information
node seeders/seeder.js status
node seeders/seeder.js list

# Options
node seeders/seeder.js seed all --force    # Force overwrite existing data
node seeders/seeder.js seed users --quiet  # Suppress verbose output
```

## Table Dependencies

The seeder system automatically handles dependencies between tables:

```
Users (no dependencies)
  ↓
Products (depends on Users for createdBy field)
  ↓
Orders (depends on Users and Products)
```

### Dependency Rules

1. **Seeding**: Dependencies are seeded first
2. **Cleaning**: Dependencies are cleaned in reverse order
3. **Validation**: Warns if dependencies are missing
4. **Circular Dependencies**: Detects and prevents circular dependencies

## Available Seeders

### Users Seeder

**File**: `seeders/data/userSeeder.js`
**Dependencies**: None
**Generated Data**: ~50 users

**Features**:
- Admin user: `admin@zyvo.com` (password: `admin123`)
- Test user: `test@zyvo.com` (password: `test123`)
- Random users with realistic names and emails
- Mixed roles (90% users, 10% admins)
- Active/inactive accounts (85% active)
- Password hashing with bcrypt
- Recent login timestamps

**Sample Data**:
```javascript
{
  name: "John Doe",
  email: "john.doe@example.com",
  password: "hashed_password",
  role: "user",
  isActive: true,
  lastLogin: "2025-07-05T10:30:00.000Z"
}
```

### Products Seeder

**File**: `seeders/data/productSeeder.js`
**Dependencies**: Users (for createdBy field)
**Generated Data**: ~100 products

**Features**:
- 8 categories with realistic subcategories
- Product names generated based on category
- Pricing with optional compare prices
- Stock levels and low stock thresholds
- Multiple product images
- Tags and features
- Specifications based on category
- SEO fields (title, description)
- Sales metrics (ratings, reviews, sales count)

**Categories**:
- Electronics (Smartphones, Laptops, Headphones, etc.)
- Clothing (Shirts, Pants, Shoes, etc.)
- Books (Fiction, Non-Fiction, Educational, etc.)
- Home (Furniture, Kitchen, Decor, etc.)
- Sports (Fitness, Outdoor, Team Sports, etc.)
- Beauty (Skincare, Makeup, Fragrances, etc.)
- Toys (Educational, Games, Building Sets, etc.)
- Other (Automotive, Pet Supplies, etc.)

**Sample Data**:
```javascript
{
  name: "Premium Wireless Headphones",
  price: 299.99,
  category: "Electronics",
  subcategory: "Headphones",
  stock: 50,
  tags: ["wireless", "audio", "premium"],
  createdBy: "user_id_reference"
}
```

### Orders Seeder

**File**: `seeders/data/orderSeeder.js`
**Dependencies**: Users, Products
**Generated Data**: ~200 orders

**Features**:
- Realistic order workflow and statuses
- Multiple payment methods and statuses
- Shipping and billing addresses
- Order items with product references
- Product snapshots (for historical data)
- Tax and shipping calculations
- Status history tracking
- Tracking numbers for shipped orders
- Refund and cancellation data

**Order Statuses**:
- pending (10%)
- confirmed (15%)
- processing (20%)
- shipped (25%)
- delivered (25%)
- cancelled (4%)
- refunded (1%)

**Sample Data**:
```javascript
{
  orderNumber: "ORD-1641024000000-A1B2C",
  user: "user_id_reference",
  items: [
    {
      product: "product_id_reference",
      quantity: 2,
      unitPrice: 299.99,
      totalPrice: 599.98
    }
  ],
  status: "delivered",
  paymentStatus: "paid",
  total: 647.98
}
```

## Data Generation

### Faker.js Integration

The seeder uses [@faker-js/faker](https://fakerjs.dev/) for generating realistic data:

```javascript
const { faker } = require('@faker-js/faker');

// Generate realistic names
const name = faker.person.fullName();

// Generate realistic emails
const email = faker.internet.email();

// Generate realistic addresses
const address = faker.location.streetAddress();

// Generate realistic product names
const productName = faker.commerce.productName();
```

### Weighted Random Selection

For realistic distributions:

```javascript
const role = faker.helpers.weightedArrayElement([
  { weight: 90, value: 'user' },
  { weight: 10, value: 'admin' }
]);
```

### Conditional Data Generation

```javascript
// Maybe generate optional data
const comparePrice = faker.helpers.maybe(() => 
  faker.number.float({ min: price * 1.1, max: price * 1.5 })
, { probability: 0.3 });
```

## Configuration

### Adding New Seeders

1. **Create Model**: Add your Mongoose model to `models/`
2. **Create Seeder**: Add seeder file to `seeders/data/`
3. **Update Configuration**: Add to `SEEDERS` object in `seeders/seeder.js`

**Example**:
```javascript
// In seeders/seeder.js
const SEEDERS = {
  // ... existing seeders
  categories: {
    model: Category,
    seeder: categorySeeder,
    dependencies: [], // or ['users'] if needed
    description: 'Product categories'
  }
};
```

### Seeder Interface

Each seeder must implement:

```javascript
// seeders/data/mySeeder.js
module.exports = {
  seed: async (Model) => {
    // Seeding logic
    const result = await Model.insertMany(data);
    return {
      count: result.length,
      summary: "Optional summary text"
    };
  },
  
  clean: async (Model) => {
    // Cleaning logic (optional, auto-generated if not provided)
    const count = await Model.countDocuments();
    await Model.deleteMany({});
    return { count };
  }
};
```

## Error Handling

### Common Errors

1. **Missing Dependencies**:
   ```
   ❌ Dependencies not met for 'products'
   ```
   Solution: Seed dependencies first: `npm run seed:users`

2. **Duplicate Data**:
   ```
   ❌ Duplicate email found. Some users may already exist.
   ```
   Solution: Use `--force` flag to overwrite or clean table first

3. **Database Connection**:
   ```
   ❌ Database connection failed
   ```
   Solution: Check MongoDB connection string in `.env`

### Validation

The seeder performs validation before operations:

- **Dependency Checks**: Ensures required tables have data
- **Duplicate Prevention**: Warns about existing data
- **Schema Validation**: Uses Mongoose schema validation
- **Reference Validation**: Checks for valid foreign key references

## Best Practices

### 1. Seeding Order

Always seed in dependency order:
```bash
npm run seed:users      # First
npm run seed:products   # Second (needs users)
npm run seed:orders     # Third (needs users and products)
```

Or use the automatic dependency resolution:
```bash
npm run seed:all        # Handles order automatically
```

### 2. Development Workflow

```bash
# Initial setup
npm run seed:all

# After model changes
npm run clean:all
npm run seed:all

# Quick reset
npm run db:reset
```

### 3. Production Considerations

- **Never run seeders in production**
- **Use environment checks**:
  ```javascript
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seeders should not be run in production');
  }
  ```
- **Create separate production data migration scripts**

### 4. Testing

```javascript
// Use seeders in tests
const { userSeeder } = require('../seeders/data/userSeeder');

beforeEach(async () => {
  await User.deleteMany({});
  await userSeeder.seed(User);
});
```

## Performance

### Batch Operations

The seeder uses efficient batch operations:
```javascript
// Efficient: Insert all records at once
await Model.insertMany(records);

// Inefficient: Insert one by one
for (const record of records) {
  await Model.create(record);
}
```

### Memory Management

For large datasets:
- Use streaming for very large files
- Process in batches if needed
- Clear unused variables

### Database Indexes

Ensure proper indexes are defined in your models:
```javascript
// In your model
userSchema.index({ email: 1 });
productSchema.index({ category: 1, isActive: 1 });
```

## Troubleshooting

### Debug Mode

Enable debug logging:
```bash
DEBUG=seeder npm run seed:all
```

### Verbose Output

Use verbose mode for detailed information:
```bash
node seeders/seeder.js seed all --verbose
```

### Check Status

Monitor database status:
```bash
npm run db:status
```

### Manual Cleanup

If automatic cleanup fails:
```bash
# Connect to MongoDB directly
mongo your_database_name

# Drop collections
db.users.drop()
db.products.drop()
db.orders.drop()
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Database Seeding

on:
  push:
    branches: [develop]

jobs:
  seed:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:latest
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Seed database
        run: npm run seed:all
        env:
          MONGODB_URI: mongodb://localhost:27017/test_db
```

### Docker Integration

```dockerfile
# In your Dockerfile
COPY seeders/ ./seeders/
RUN npm run seed:all
```

## Advanced Usage

### Custom Seeding Logic

```javascript
// Custom seeding with specific parameters
const customSeed = async () => {
  // Seed 100 users
  await userSeeder.seed(User, { count: 100 });
  
  // Seed products for specific categories
  await productSeeder.seed(Product, { 
    categories: ['Electronics', 'Books'],
    count: 50
  });
};
```

### Conditional Seeding

```javascript
// Seed only if empty
if (await User.countDocuments() === 0) {
  await userSeeder.seed(User);
}
```

### Environment-Specific Data

```javascript
// Different data for different environments
const getUserCount = () => {
  switch (process.env.NODE_ENV) {
    case 'test': return 10;
    case 'development': return 50;
    default: return 100;
  }
};
```

This seeder system provides a robust foundation for managing test data in your application with proper dependency handling, realistic data generation, and comprehensive error handling.
