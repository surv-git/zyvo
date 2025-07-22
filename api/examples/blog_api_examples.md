# Blog API Usage Examples

This document provides comprehensive examples of how to use the Blog Management System API endpoints.

## Prerequisites

1. Server is running on `http://localhost:3000` (adjust URL as needed)
2. You have admin authentication credentials
3. At least one category exists in your database
4. At least one user exists in your database

## Admin API Examples

### 1. Create a Blog Post

**Endpoint:** `POST /api/v1/admin/blog/posts`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_ADMIN_JWT_TOKEN"
}
```

**Request Body:**
```json
{
  "title": "Getting Started with Our E-commerce API",
  "content": "<h1>Welcome to Our API</h1><p>This comprehensive guide will help you understand how to integrate with our e-commerce platform. Our API provides powerful features for managing products, orders, and customer data.</p><p>In this post, we'll cover the basics of authentication, making your first API call, and handling responses. Whether you're building a mobile app, web application, or integrating with existing systems, this guide has you covered.</p>",
  "author_id": "60d5ecb74b24a1234567890a",
  "category_id": "60d5ecb74b24a1234567890b",
  "excerpt": "Learn how to integrate with our e-commerce API in this comprehensive getting started guide.",
  "tags": ["api", "tutorial", "getting-started", "e-commerce"],
  "featured_image_url": "https://example.com/images/api-guide.jpg",
  "featured_image_alt_text": "API integration guide illustration",
  "status": "PUBLISHED",
  "seo_title": "E-commerce API Integration Guide - Getting Started",
  "meta_description": "Complete guide to integrating with our e-commerce API. Learn authentication, API calls, and best practices.",
  "is_featured": true,
  "comments_enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Blog post created successfully",
  "data": {
    "_id": "60d5ecb74b24a1234567890c",
    "title": "Getting Started with Our E-commerce API",
    "slug": "getting-started-with-our-e-commerce-api",
    "content": "<h1>Welcome to Our API</h1>...",
    "excerpt": "Learn how to integrate with our e-commerce API...",
    "author_id": {
      "_id": "60d5ecb74b24a1234567890a",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "category_id": {
      "_id": "60d5ecb74b24a1234567890b",
      "name": "Technology",
      "slug": "technology"
    },
    "tags": ["api", "tutorial", "getting-started", "e-commerce"],
    "read_time_minutes": 3,
    "status": "PUBLISHED",
    "published_at": "2023-06-25T10:30:00.000Z",
    "views_count": 0,
    "is_featured": true,
    "comments_enabled": true,
    "createdAt": "2023-06-25T10:30:00.000Z",
    "updatedAt": "2023-06-25T10:30:00.000Z"
  }
}
```

### 2. Get All Blog Posts (Admin View)

**Endpoint:** `GET /api/v1/admin/blog/posts`

**Query Parameters:**
- `page=1` - Page number
- `limit=10` - Items per page
- `status=PUBLISHED` - Filter by status
- `category_id=60d5ecb74b24a1234567890b` - Filter by category
- `search=API` - Search in title, excerpt, content
- `sort_by=published_at` - Sort field
- `sort_order=desc` - Sort order

**Example Request:**
```bash
GET /api/v1/admin/blog/posts?page=1&limit=5&status=PUBLISHED&sort_by=published_at&sort_order=desc
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ecb74b24a1234567890c",
      "title": "Getting Started with Our E-commerce API",
      "slug": "getting-started-with-our-e-commerce-api",
      "excerpt": "Learn how to integrate with our e-commerce API...",
      "author_id": {
        "_id": "60d5ecb74b24a1234567890a",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "category_id": {
        "_id": "60d5ecb74b24a1234567890b",
        "name": "Technology",
        "slug": "technology"
      },
      "status": "PUBLISHED",
      "published_at": "2023-06-25T10:30:00.000Z",
      "views_count": 42,
      "is_featured": true
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_items": 15,
    "items_per_page": 5,
    "has_next_page": true,
    "has_prev_page": false
  }
}
```

### 3. Update a Blog Post

**Endpoint:** `PATCH /api/v1/admin/blog/posts/60d5ecb74b24a1234567890c`

**Request Body:**
```json
{
  "title": "Complete Guide to E-commerce API Integration",
  "content": "<h1>Updated Content</h1><p>This is the updated comprehensive guide...</p>",
  "tags": ["api", "tutorial", "getting-started", "e-commerce", "integration"],
  "is_featured": false
}
```

### 4. Update Blog Post Status

**Endpoint:** `PATCH /api/v1/admin/blog/posts/60d5ecb74b24a1234567890c/status`

**Request Body:**
```json
{
  "status": "PUBLISHED"
}
```

### 5. Delete a Blog Post (Soft Delete)

**Endpoint:** `DELETE /api/v1/admin/blog/posts/60d5ecb74b24a1234567890c`

**Response:**
```json
{
  "success": true,
  "message": "Blog post deleted successfully"
}
```

## Public API Examples

### 1. Get All Published Blog Posts

**Endpoint:** `GET /api/v1/blog/posts`

**Query Parameters:**
- `page=1` - Page number
- `limit=10` - Items per page
- `category_id=60d5ecb74b24a1234567890b` - Filter by category
- `tags=api,tutorial` - Filter by tags (comma-separated)
- `is_featured=true` - Filter featured posts
- `search=API` - Search in title and excerpt
- `sort_by=published_at` - Sort field
- `sort_order=desc` - Sort order

**Example Request:**
```bash
GET /api/v1/blog/posts?page=1&limit=6&is_featured=true&sort_by=published_at&sort_order=desc
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ecb74b24a1234567890c",
      "title": "Getting Started with Our E-commerce API",
      "slug": "getting-started-with-our-e-commerce-api",
      "excerpt": "Learn how to integrate with our e-commerce API...",
      "author_id": {
        "_id": "60d5ecb74b24a1234567890a",
        "name": "John Doe"
      },
      "category_id": {
        "_id": "60d5ecb74b24a1234567890b",
        "name": "Technology",
        "slug": "technology"
      },
      "tags": ["api", "tutorial", "getting-started", "e-commerce"],
      "read_time_minutes": 3,
      "featured_image_url": "https://example.com/images/api-guide.jpg",
      "featured_image_alt_text": "API integration guide illustration",
      "published_at": "2023-06-25T10:30:00.000Z",
      "views_count": 42,
      "is_featured": true
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 2,
    "total_items": 8,
    "items_per_page": 6,
    "has_next_page": true,
    "has_prev_page": false
  }
}
```

### 2. Get Single Blog Post by Slug

**Endpoint:** `GET /api/v1/blog/posts/getting-started-with-our-e-commerce-api`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ecb74b24a1234567890c",
    "title": "Getting Started with Our E-commerce API",
    "slug": "getting-started-with-our-e-commerce-api",
    "content": "<h1>Welcome to Our API</h1><p>This comprehensive guide will help you understand how to integrate with our e-commerce platform...</p>",
    "excerpt": "Learn how to integrate with our e-commerce API...",
    "author_id": {
      "_id": "60d5ecb74b24a1234567890a",
      "name": "John Doe"
    },
    "category_id": {
      "_id": "60d5ecb74b24a1234567890b",
      "name": "Technology",
      "slug": "technology",
      "description": "Technology and development related posts"
    },
    "tags": ["api", "tutorial", "getting-started", "e-commerce"],
    "read_time_minutes": 3,
    "featured_image_url": "https://example.com/images/api-guide.jpg",
    "featured_image_alt_text": "API integration guide illustration",
    "status": "PUBLISHED",
    "published_at": "2023-06-25T10:30:00.000Z",
    "views_count": 43,
    "seo_title": "E-commerce API Integration Guide - Getting Started",
    "meta_description": "Complete guide to integrating with our e-commerce API. Learn authentication, API calls, and best practices.",
    "is_featured": true,
    "comments_enabled": true,
    "createdAt": "2023-06-25T10:30:00.000Z",
    "updatedAt": "2023-06-25T10:30:00.000Z"
  }
}
```

### 3. Get Popular Tags

**Endpoint:** `GET /api/v1/blog/tags/popular?limit=10`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "tag": "api",
      "count": 15
    },
    {
      "tag": "tutorial",
      "count": 12
    },
    {
      "tag": "e-commerce",
      "count": 10
    },
    {
      "tag": "integration",
      "count": 8
    },
    {
      "tag": "getting-started",
      "count": 6
    }
  ]
}
```

## Error Responses

### Validation Error Example
```json
{
  "success": false,
  "message": "Validation errors",
  "errors": [
    {
      "type": "field",
      "value": "",
      "msg": "Title is required",
      "path": "title",
      "location": "body"
    },
    {
      "type": "field",
      "value": "invalid-id",
      "msg": "Invalid category ID format",
      "path": "category_id",
      "location": "body"
    }
  ]
}
```

### Not Found Error Example
```json
{
  "success": false,
  "message": "Blog post not found"
}
```

### Authentication Error Example
```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

## JavaScript/Node.js Examples

### Using Fetch API

```javascript
// Create a blog post
async function createBlogPost() {
  const response = await fetch('/api/v1/admin/blog/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_ADMIN_JWT_TOKEN'
    },
    body: JSON.stringify({
      title: 'My New Blog Post',
      content: '<p>This is the content of my blog post.</p>',
      author_id: 'USER_ID_HERE',
      category_id: 'CATEGORY_ID_HERE',
      tags: ['example', 'demo'],
      status: 'DRAFT'
    })
  });
  
  const result = await response.json();
  console.log(result);
}

// Get published blog posts
async function getBlogPosts() {
  const response = await fetch('/api/v1/blog/posts?page=1&limit=10');
  const result = await response.json();
  console.log(result.data); // Array of blog posts
}

// Get single blog post
async function getBlogPost(slug) {
  const response = await fetch(`/api/v1/blog/posts/${slug}`);
  const result = await response.json();
  console.log(result.data); // Single blog post
}
```

### Using Axios

```javascript
const axios = require('axios');

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add admin token for admin requests
const adminApi = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ADMIN_JWT_TOKEN'
  }
});

// Create blog post
async function createPost() {
  try {
    const response = await adminApi.post('/admin/blog/posts', {
      title: 'New Blog Post',
      content: '<p>Content here</p>',
      author_id: 'USER_ID',
      category_id: 'CATEGORY_ID',
      status: 'PUBLISHED'
    });
    console.log('Post created:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

// Get blog posts
async function getPosts() {
  try {
    const response = await api.get('/blog/posts', {
      params: {
        page: 1,
        limit: 10,
        sort_by: 'published_at',
        sort_order: 'desc'
      }
    });
    console.log('Posts:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}
```

## Frontend Integration Tips

### SEO Optimization
```html
<!-- Use the SEO fields from the blog post -->
<head>
  <title>{{ post.seo_title || post.title }}</title>
  <meta name="description" content="{{ post.meta_description || post.excerpt }}">
  <meta property="og:title" content="{{ post.title }}">
  <meta property="og:description" content="{{ post.excerpt }}">
  <meta property="og:image" content="{{ post.featured_image_url }}">
  <meta property="og:url" content="{{ baseUrl }}/blog/{{ post.slug }}">
</head>
```

### Display Blog Post
```html
<article>
  <header>
    <h1>{{ post.title }}</h1>
    <div class="meta">
      <span>By {{ post.author_id.name }}</span>
      <span>{{ formatDate(post.published_at) }}</span>
      <span>{{ post.read_time_minutes }} min read</span>
      <span>{{ post.views_count }} views</span>
    </div>
    <div class="tags">
      <span v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</span>
    </div>
  </header>
  
  <img v-if="post.featured_image_url" 
       :src="post.featured_image_url" 
       :alt="post.featured_image_alt_text || post.title">
  
  <div class="content" v-html="post.content"></div>
</article>
```

This completes the comprehensive blog API examples. The system is now fully functional and ready for use!
