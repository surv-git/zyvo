# Unsplash Integration Documentation

## Overview

The Zyvo API now includes comprehensive Unsplash integration to automatically fetch high-quality images for products and categories. This integration provides both automatic image population and manual image management capabilities.

## Features

### ✨ Automatic Image Population
- **New Products**: Automatically fetch 3 relevant images when creating products without images
- **New Categories**: Automatically fetch 1 hero image when creating categories without images
- **Smart Search**: Uses product name + category for better image relevance
- **Fallback Handling**: Gracefully handles API failures without breaking product/category creation

### 🔧 Manual Image Management
- **Image Search**: Search Unsplash for specific images
- **Image Suggestions**: Get curated suggestions for existing products/categories
- **Bulk Population**: Populate images for existing products and categories
- **CLI Tools**: Command-line utilities for batch operations

## Setup

### 1. Environment Configuration

Add your Unsplash API credentials to `.env`:

```bash
# Unsplash API Configuration
UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
```

### 2. Get Unsplash API Key

1. Visit [Unsplash Developers](https://unsplash.com/developers)
2. Create a new application
3. Copy your Access Key
4. Add it to your `.env` file

### 3. Verify Setup

Check if the integration is working:

```bash
# Test the integration
./debug/test-unsplash-integration.sh

# Or check status via API
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     http://localhost:3000/api/v1/unsplash/status
```

## API Endpoints

All Unsplash endpoints require admin authentication.

### 🔍 Search Images

```http
GET /api/v1/unsplash/search
```

**Parameters:**
- `query` (required): Search query
- `count` (optional): Number of images (1-30, default: 10)
- `orientation` (optional): landscape, portrait, squarish (default: landscape)

**Example:**
```bash
curl -H "Authorization: Bearer TOKEN" \
     "http://localhost:3000/api/v1/unsplash/search?query=electronics&count=5"
```

### 📦 Product Image Suggestions

```http
GET /api/v1/unsplash/product/{productId}/suggestions
```

**Parameters:**
- `count` (optional): Number of suggestions (1-20, default: 5)

**Example:**
```bash
curl -H "Authorization: Bearer TOKEN" \
     "http://localhost:3000/api/v1/unsplash/product/64a1b2c3d4e5f6789abcdef1/suggestions?count=3"
```

### 📂 Category Image Suggestions

```http
GET /api/v1/unsplash/category/{categoryId}/suggestions
```

**Parameters:**
- `count` (optional): Number of suggestions (1-20, default: 5)

**Example:**
```bash
curl -H "Authorization: Bearer TOKEN" \
     "http://localhost:3000/api/v1/unsplash/category/64a1b2c3d4e5f6789abcdef1/suggestions"
```

### 🚀 Bulk Image Population

```http
POST /api/v1/unsplash/populate
```

**Request Body:**
```json
{
  "overwrite": false,
  "skipProducts": false,
  "skipCategories": false,
  "productLimit": 0,
  "categoryLimit": 0
}
```

**Example:**
```bash
curl -X POST \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"productLimit": 10, "categoryLimit": 5}' \
     http://localhost:3000/api/v1/unsplash/populate
```

### ✅ Service Status

```http
GET /api/v1/unsplash/status
```

**Example:**
```bash
curl -H "Authorization: Bearer TOKEN" \
     http://localhost:3000/api/v1/unsplash/status
```

## CLI Tools

### Bulk Image Population Script

Populate images for all products and categories:

```bash
# Basic usage - populate all missing images
node scripts/populate-images.js

# Overwrite existing images
node scripts/populate-images.js --overwrite

# Limit processing
node scripts/populate-images.js --product-limit 50 --category-limit 20

# Skip products, only do categories
node scripts/populate-images.js --skip-products --category-limit 10

# Skip categories, only do products
node scripts/populate-images.js --skip-categories --product-limit 100
```

**Available Options:**
- `--help, -h`: Show help message
- `--overwrite, -o`: Overwrite existing images
- `--skip-products`: Skip product image population
- `--skip-categories`: Skip category image population
- `--product-limit <num>`: Limit number of products to process
- `--category-limit <num>`: Limit number of categories to process

## Automatic Integration

### Product Creation

When creating products via API, images are automatically fetched if:
1. No `images` array is provided in the request
2. Empty `images` array is provided
3. Unsplash service is configured

```javascript
// This will auto-fetch images
POST /api/v1/products
{
  "name": "Wireless Headphones",
  "description": "High-quality headphones",
  "category_id": "64a1b2c3d4e5f6789abcdef1"
  // No images field - will auto-fetch from Unsplash
}
```

### Category Creation

When creating categories via API, images are automatically fetched if:
1. No `image_url` is provided in the request
2. Empty `image_url` is provided
3. Unsplash service is configured

```javascript
// This will auto-fetch image
POST /api/v1/categories
{
  "name": "Electronics",
  "description": "Electronic devices and accessories"
  // No image_url field - will auto-fetch from Unsplash
}
```

## Image Search Strategy

### Products
- **Primary Query**: `{product_name} {category_name}`
- **Fallback**: `{product_name}`
- **Image Count**: 3 images per product
- **Orientation**: Landscape (best for product galleries)

### Categories
- **Primary Query**: `{category_name} products collection`
- **Enhanced Mapping**: Common categories mapped to better search terms
- **Image Count**: 1 hero image per category
- **Orientation**: Landscape (best for category headers)

### Category Mappings

The system includes smart mappings for common categories:

```javascript
{
  'electronics': 'modern electronics devices gadgets',
  'clothing': 'fashion clothing apparel style',
  'shoes': 'footwear sneakers boots shoes',
  'accessories': 'fashion accessories jewelry watches',
  'home': 'home decor interior design furniture',
  // ... and more
}
```

## Error Handling

### Graceful Degradation
- API failures don't break product/category creation
- Warnings logged but operations continue
- Empty image arrays returned on failures

### Rate Limiting
- Built-in delays between API calls
- Respects Unsplash API rate limits
- Automatic retry logic for temporary failures

### Logging
```javascript
// Success logs
✅ Auto-fetched 3 images for product: Wireless Headphones
✅ Auto-fetched image for category: Electronics

// Warning logs
⚠️  Failed to fetch Unsplash images for product: API rate limit exceeded
⚠️  Unsplash service not configured
```

## Best Practices

### 1. API Key Management
- Store API key in environment variables
- Never commit API keys to version control
- Use separate keys for development/production

### 2. Rate Limiting
- Unsplash has rate limits (50 requests/hour for demo, 5000/hour for production)
- Use bulk population during off-peak hours
- Monitor usage in Unsplash dashboard

### 3. Image Quality
- Unsplash provides multiple sizes (thumb, small, regular, full)
- API uses 'regular' size by default (good balance of quality/size)
- Consider implementing image optimization/CDN

### 4. Search Optimization
- Use descriptive product names for better image matching
- Organize products into specific categories
- Consider adding brand names to product names

## Troubleshooting

### Common Issues

#### 1. "Unsplash service not configured"
**Solution:** Add `UNSPLASH_ACCESS_KEY` to `.env` file

#### 2. "No images found"
**Possible Causes:**
- Generic product names
- API rate limit exceeded
- Network connectivity issues

**Solutions:**
- Use more specific product names
- Wait for rate limit reset
- Check internet connection

#### 3. "API rate limit exceeded"
**Solutions:**
- Wait for rate limit reset (resets hourly)
- Upgrade to production Unsplash app
- Use bulk population during off-peak hours

#### 4. Images not appearing in responses
**Check:**
- Product/category was created after integration
- Unsplash service was configured during creation
- Check server logs for error messages

### Debug Commands

```bash
# Test Unsplash integration
./debug/test-unsplash-integration.sh

# Check service status
curl -H "Authorization: Bearer TOKEN" \
     http://localhost:3000/api/v1/unsplash/status

# Test image search
curl -H "Authorization: Bearer TOKEN" \
     "http://localhost:3000/api/v1/unsplash/search?query=test&count=1"
```

## Performance Considerations

### 1. Background Processing
- Bulk population runs in background
- Won't block API responses
- Monitor server resources during bulk operations

### 2. Caching
- Consider implementing image URL caching
- Cache successful searches to reduce API calls
- Implement fallback images for failed requests

### 3. Database Impact
- Image URLs stored as strings in MongoDB
- Minimal database overhead
- Consider indexing if searching by image presence

## Security Considerations

### 1. API Key Security
- Environment variables only
- Restrict API key permissions in Unsplash dashboard
- Rotate keys regularly

### 2. Admin-Only Access
- All Unsplash endpoints require admin authentication
- Prevents unauthorized API usage
- Protects against quota abuse

### 3. Input Validation
- All search queries validated
- Rate limiting on API endpoints
- Sanitized search terms

## Monitoring and Analytics

### 1. Usage Tracking
- Monitor Unsplash API usage in dashboard
- Track success/failure rates in logs
- Monitor quota consumption

### 2. Performance Metrics
- Image fetch success rates
- API response times
- Background job completion times

### 3. Error Monitoring
- Failed image fetches
- API rate limit hits
- Network connectivity issues

## Future Enhancements

### Planned Features
- [ ] Image optimization and resizing
- [ ] CDN integration for faster loading
- [ ] Alternative image providers (Pexels, Pixabay)
- [ ] AI-powered image tagging and categorization
- [ ] Automatic image A/B testing
- [ ] Custom image upload with Unsplash fallback

### Integration Opportunities
- [ ] Product variant images
- [ ] Brand logo fetching
- [ ] Blog post featured images
- [ ] User avatar suggestions
- [ ] Email template images

---

## Support

For issues or questions about Unsplash integration:

1. Check the troubleshooting section above
2. Run the test script: `./debug/test-unsplash-integration.sh`
3. Check server logs for detailed error messages
4. Verify Unsplash API key and quotas

**Remember:** Unsplash integration enhances the user experience but should never break core functionality. All operations gracefully handle failures.
