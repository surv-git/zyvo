# Dynamic Content Management System - Integration Guide

## 🎯 System Overview

The Dynamic Content Management System allows you to manage various visual and textual content elements (carousels, marquee text, advertisements, offers, promos) that can be fetched by the frontend application without requiring rebuilds or deployments.

## 📁 Files Created

### Core Files:
- ✅ `models/DynamicContent.js` - Mongoose model with comprehensive validation
- ✅ `controllers/dynamicContent.controller.js` - Business logic for all operations
- ✅ `routes/adminDynamicContent.routes.js` - Admin-protected routes
- ✅ `routes/publicDynamicContent.routes.js` - Public content delivery routes

## 🔧 App.js Integration

To integrate the Dynamic Content Management System into your application, add the following lines to your `app.js` file:

### Step 1: Import the Route Files

Add these imports near the top of your `app.js` file with other route imports:

```javascript
// Dynamic Content Routes
const adminDynamicContentRoutes = require('./routes/adminDynamicContent.routes');
const publicDynamicContentRoutes = require('./routes/publicDynamicContent.routes');
```

### Step 2: Add Admin Routes (Protected)

Add the admin routes with authentication middleware:

```javascript
// Admin Dynamic Content Routes (requires admin authentication)
app.use('/api/v1/admin/dynamic-content', adminAuthMiddleware, adminDynamicContentRoutes);
```

### Step 3: Add Public Routes (No Authentication)

Add the public routes for frontend content delivery:

```javascript
// Public Dynamic Content Routes (no authentication required)
app.use('/api/v1/content', publicDynamicContentRoutes);
```

### Complete Integration Example:

```javascript
// ... other imports ...

// Dynamic Content Routes
const adminDynamicContentRoutes = require('./routes/adminDynamicContent.routes');
const publicDynamicContentRoutes = require('./routes/publicDynamicContent.routes');

// ... middleware setup ...

// Admin Routes (protected)
app.use('/api/v1/admin/dynamic-content', adminAuthMiddleware, adminDynamicContentRoutes);

// Public Routes (open)
app.use('/api/v1/content', publicDynamicContentRoutes);

// ... other routes ...
```

## 🚀 API Endpoints

### Admin Endpoints (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/admin/dynamic-content` | Create new content item |
| GET | `/api/v1/admin/dynamic-content` | Get all content (paginated, filterable) |
| GET | `/api/v1/admin/dynamic-content/stats` | Get content statistics |
| GET | `/api/v1/admin/dynamic-content/:id` | Get single content item |
| PATCH | `/api/v1/admin/dynamic-content/:id` | Update content item |
| DELETE | `/api/v1/admin/dynamic-content/:id` | Soft delete content item |

### Public Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/content/locations` | Get available content locations |
| GET | `/api/v1/content/:locationKey/:type` | Get active content by location/type |

## 📋 Content Types Supported

- **CAROUSEL** - Image-based sliding content
- **MARQUEE** - Scrolling text banners
- **ADVERTISEMENT** - Promotional ads
- **OFFER** - Special offers and deals
- **PROMO** - Promotional content

## 🎨 Usage Examples

### Frontend Integration Examples:

```javascript
// Get homepage carousel content
fetch('/api/v1/content/HOME_HERO_SLIDER/CAROUSEL')
  .then(response => response.json())
  .then(data => {
    // data.data contains array of carousel items
    renderCarousel(data.data);
  });

// Get marquee banner with audience targeting
fetch('/api/v1/content/MARQUEE_TOP/MARQUEE?audience=new_user,premium_member')
  .then(response => response.json())
  .then(data => {
    renderMarquee(data.data);
  });

// Get available content locations
fetch('/api/v1/content/locations')
  .then(response => response.json())
  .then(data => {
    // data.data contains available location/type combinations
    console.log('Available content locations:', data.data);
  });
```

### Admin Panel Integration:

```javascript
// Create new carousel item
const newContent = {
  name: "Summer Sale Hero Banner",
  type: "CAROUSEL",
  location_key: "HOME_HERO_SLIDER",
  content_order: 1,
  is_active: true,
  primary_image_url: "https://example.com/summer-sale.jpg",
  mobile_image_url: "https://example.com/summer-sale-mobile.jpg",
  alt_text: "Summer Sale - Up to 50% Off",
  caption: "Summer Sale",
  link_url: "https://example.com/summer-sale",
  call_to_action_text: "Shop Now",
  target_audience_tags: ["all_users"],
  metadata: {
    text_color: "#FFFFFF",
    background_color: "#FF6B35",
    animation_type: "fade"
  }
};

fetch('/api/v1/admin/dynamic-content', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify(newContent)
})
.then(response => response.json())
.then(data => console.log('Content created:', data));
```

## 🔒 Security Features

- **Admin Authentication** - All admin endpoints protected
- **Input Validation** - Comprehensive validation using express-validator
- **Audit Logging** - Admin actions logged for compliance
- **Soft Delete** - Content deactivated rather than permanently deleted
- **Date-based Activation** - Automatic content scheduling
- **Target Audience** - Content personalization support

## 📊 Advanced Features

### Content Scheduling
```javascript
{
  "display_start_date": "2024-07-15T00:00:00Z",
  "display_end_date": "2024-07-31T23:59:59Z"
}
```

### Audience Targeting
```javascript
{
  "target_audience_tags": ["new_user", "premium_member", "mobile_user"]
}
```

### Flexible Metadata
```javascript
{
  "metadata": {
    "text_color": "#FFFFFF",
    "background_color": "#FF0000",
    "animation_type": "slide",
    "duration": 5000,
    "custom_css_class": "special-promo"
  }
}
```

## 🧪 Testing the System

### Test Admin Endpoints:
```bash
# Create content
curl -X POST http://localhost:3000/api/v1/admin/dynamic-content \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Banner","type":"MARQUEE","location_key":"TEST_LOCATION","main_text_content":"Hello World!"}'

# Get all content
curl -X GET "http://localhost:3000/api/v1/admin/dynamic-content?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Test Public Endpoints:
```bash
# Get active content
curl -X GET http://localhost:3000/api/v1/content/HOME_HERO_SLIDER/CAROUSEL

# Get available locations
curl -X GET http://localhost:3000/api/v1/content/locations
```

## 🎉 Benefits

1. **No Frontend Rebuilds** - Update content without code deployments
2. **Flexible Content Types** - Support for various content formats
3. **Scheduling** - Automatic content activation/deactivation
4. **Targeting** - Personalized content delivery
5. **Admin Friendly** - Easy content management interface
6. **Performance Optimized** - Efficient queries with proper indexing
7. **SEO Ready** - Alt text and metadata support
8. **Mobile Responsive** - Separate mobile image support

Your Dynamic Content Management System is now ready for integration! 🚀✨
