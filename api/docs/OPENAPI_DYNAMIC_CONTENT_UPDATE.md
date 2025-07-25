# OpenAPI DynamicContent Documentation Update

## Overview
Updated the OpenAPI documentation to accurately reflect the actual DynamicContent model and endpoints implementation.

## Schema Changes

### Before (Incorrect)
```yaml
DynamicContent:
  required: [key, content_type]
  properties:
    key: {type: string}
    title: {type: string}
    content_type: {enum: [text, html, json, image]}
    content: {type: string}
    version: {type: integer}
    tags: {type: array}
```

### After (Corrected)
```yaml
DynamicContent:
  required: [name, type, location_key, created_by]
  properties:
    name: {type: string, maxLength: 200}
    type: {enum: [CAROUSEL, MARQUEE, ADVERTISEMENT, OFFER, PROMO]}
    location_key: {type: string, maxLength: 100}
    primary_image_url: {type: string, format: uri}
    main_text_content: {type: string, maxLength: 1000}
    target_audience_tags: {type: array}
    # ... complete schema with all 20+ fields
```

## Endpoint Changes

### Public Endpoints

#### Before (Incorrect)
- `GET /api/v1/content/{key}` - Get content by key

#### After (Corrected)
- `GET /api/v1/content/locations` - Get all available content locations and types
- `GET /api/v1/content/{locationKey}/{type}` - Get active content by location and type
  - Example: `/api/v1/content/HOME_HERO_SLIDER/CAROUSEL`
  - Supports audience targeting via query parameter

### Admin Endpoints

#### Before (Incorrect Paths)
- `GET /api/v1/admin/content`
- `POST /api/v1/admin/content`
- `GET /api/v1/admin/content/{id}`
- `PUT /api/v1/admin/content/{id}`
- `DELETE /api/v1/admin/content/{id}`

#### After (Corrected Paths)
- `GET /api/v1/admin/dynamic-content` - Get all with filtering/pagination
- `POST /api/v1/admin/dynamic-content` - Create new content
- `GET /api/v1/admin/dynamic-content/stats` - Get content statistics
- `GET /api/v1/admin/dynamic-content/{id}` - Get single item
- `PATCH /api/v1/admin/dynamic-content/{id}` - Update item
- `DELETE /api/v1/admin/dynamic-content/{id}` - Delete (soft delete)

## Key Model Features Now Documented

### Content Types & Validation
- **CAROUSEL, ADVERTISEMENT, OFFER, PROMO**: Require `primary_image_url`
- **MARQUEE**: Requires `main_text_content`

### Scheduling & Targeting
- `display_start_date` / `display_end_date` for content scheduling
- `target_audience_tags` for audience-specific content
- `is_currently_active` virtual field combining status and date checks

### Content Organization
- `location_key` for content placement (e.g., "HOME_HERO_SLIDER")
- `content_order` for display ordering
- `type` enumeration for content categorization

### Rich Content Support
- Dual image support (`primary_image_url`, `mobile_image_url`)
- Accessibility with `alt_text`
- Clickable content with `link_url` and `call_to_action_text`
- Flexible `metadata` object for additional data

### Admin Features
- Content statistics endpoint showing type-based counts
- Comprehensive filtering (type, location, active status, search)
- Audit tracking with `created_by` and `updated_by`
- Pagination support

## Validation Rules Now Documented

### String Length Limits
- `name`: 1-200 characters
- `location_key`: 1-100 characters (uppercase, numbers, underscores)
- `alt_text`: max 250 characters
- `caption`: max 500 characters
- `main_text_content`: max 1000 characters
- `call_to_action_text`: max 50 characters
- `target_audience_tags[]`: each tag max 50 characters

### URL Validation
- All URL fields validated as proper URIs
- Supports http/https protocols

### Date Validation
- `display_end_date` must be after `display_start_date`
- Both dates optional (null for immediate/indefinite)

## Request/Response Examples

### Create Carousel Content
```json
POST /api/v1/admin/dynamic-content
{
  "name": "Summer Sale Hero Banner",
  "type": "CAROUSEL",
  "location_key": "HOME_HERO_SLIDER",
  "primary_image_url": "https://example.com/summer-sale.jpg",
  "mobile_image_url": "https://example.com/summer-sale-mobile.jpg",
  "alt_text": "Summer Sale - Up to 50% off",
  "link_url": "https://example.com/summer-sale",
  "call_to_action_text": "Shop Now",
  "target_audience_tags": ["summer_shoppers", "sale_interested"],
  "is_active": true
}
```

### Get Active Content for Location
```json
GET /api/v1/content/HOME_HERO_SLIDER/CAROUSEL?audience=summer_shoppers

Response:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Summer Sale Hero Banner",
      "type": "CAROUSEL",
      "location_key": "HOME_HERO_SLIDER",
      "primary_image_url": "https://example.com/summer-sale.jpg",
      // ... other fields
    }
  ]
}
```

## Breaking Changes from Previous Schema

⚠️ **Field Name Changes**:
- `key` → `name`
- `content_type` → `type` (with different enum values)
- `content` → `main_text_content`
- `tags` → `target_audience_tags`

⚠️ **Endpoint Path Changes**:
- `/api/v1/admin/content` → `/api/v1/admin/dynamic-content`
- Single key lookup → location + type lookup

⚠️ **New Required Fields**:
- `location_key` (new concept)
- `created_by` (audit requirement)

## Impact

✅ **Benefits**:
- API documentation now matches actual implementation
- Client SDK generation will be accurate
- Developer documentation is reliable
- All model features properly documented

🔄 **Next Steps**:
- Regenerate client SDKs if using automated tools
- Update frontend code to use correct field names and endpoints
- Test all endpoints against updated schema
- Update any existing API consumers to use new endpoint paths
