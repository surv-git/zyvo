# Product Review System API Examples

This document provides comprehensive examples of how to use the Product Review System API endpoints.

## Prerequisites

1. Server is running on `http://localhost:3000` (adjust URL as needed)
2. You have user and admin authentication credentials
3. At least one product variant exists in your database
4. At least one user exists in your database

## User API Examples

### 1. Submit a Product Review

**Endpoint:** `POST /api/v1/user/reviews`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_USER_JWT_TOKEN"
}
```

**Request Body:**
```json
{
  "product_variant_id": "60d5ecb74b24a1234567890a",
  "rating": 5,
  "title": "Excellent Product Quality!",
  "review_text": "I've been using this product for 3 months now and I'm thoroughly impressed. The build quality is exceptional, and it performs exactly as advertised. The customer service was also top-notch when I had a question about setup. Highly recommend this to anyone looking for a reliable solution.",
  "reviewer_display_name": "John D.",
  "reviewer_location": "New York, NY",
  "image_urls": [
    "https://example.com/images/product-in-use.jpg",
    "https://example.com/images/product-packaging.jpg"
  ],
  "video_url": "https://example.com/videos/product-demo.mp4"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": {
    "_id": "60d5ecb74b24a1234567890b",
    "user_id": {
      "_id": "60d5ecb74b24a1234567890c",
      "name": "John Doe"
    },
    "product_variant_id": {
      "_id": "60d5ecb74b24a1234567890a",
      "name": "Premium Wireless Headphones - Black"
    },
    "rating": 5,
    "title": "Excellent Product Quality!",
    "review_text": "I've been using this product for 3 months now...",
    "is_verified_buyer": true,
    "status": "APPROVED",
    "helpful_votes": 0,
    "unhelpful_votes": 0,
    "reviewer_display_name": "John D.",
    "reviewer_location": "New York, NY",
    "image_urls": [
      "https://example.com/images/product-in-use.jpg",
      "https://example.com/images/product-packaging.jpg"
    ],
    "video_url": "https://example.com/videos/product-demo.mp4",
    "createdAt": "2023-06-25T10:30:00.000Z",
    "updatedAt": "2023-06-25T10:30:00.000Z"
  }
}
```

### 2. Get My Reviews

**Endpoint:** `GET /api/v1/user/reviews/my`

**Query Parameters:**
- `page=1` - Page number
- `limit=10` - Items per page
- `status=APPROVED` - Filter by status
- `sort_by=createdAt` - Sort field
- `sort_order=desc` - Sort order

**Example Request:**
```bash
GET /api/v1/user/reviews/my?page=1&limit=5&sort_by=createdAt&sort_order=desc
Authorization: Bearer YOUR_USER_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ecb74b24a1234567890b",
      "product_variant_id": {
        "_id": "60d5ecb74b24a1234567890a",
        "name": "Premium Wireless Headphones - Black",
        "images": ["https://example.com/product-image.jpg"]
      },
      "rating": 5,
      "title": "Excellent Product Quality!",
      "review_text": "I've been using this product for 3 months now...",
      "status": "APPROVED",
      "helpful_votes": 12,
      "unhelpful_votes": 1,
      "is_verified_buyer": true,
      "createdAt": "2023-06-25T10:30:00.000Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 2,
    "total_items": 8,
    "items_per_page": 5,
    "has_next_page": true,
    "has_prev_page": false
  }
}
```

### 3. Update My Review

**Endpoint:** `PATCH /api/v1/user/reviews/:reviewId`

**Request Body:**
```json
{
  "rating": 4,
  "title": "Good Product with Minor Issues",
  "review_text": "Updated my review after using for 6 months. Still good overall but noticed some minor wear and tear.",
  "image_urls": [
    "https://example.com/images/updated-photo.jpg"
  ]
}
```

### 4. Vote on a Review

**Endpoint:** `POST /api/v1/user/reviews/:reviewId/vote`

**Request Body:**
```json
{
  "vote_type": "helpful"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vote recorded successfully",
  "data": {
    "helpful_votes": 13,
    "unhelpful_votes": 1,
    "helpful_percentage": 93
  }
}
```

### 5. Report a Review

**Endpoint:** `POST /api/v1/user/reviews/:reviewId/report`

**Request Body:**
```json
{
  "reason": "FAKE_REVIEW",
  "custom_reason": "This review appears to be fake based on the generic language and lack of specific product details."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review reported successfully"
}
```

## Public API Examples

### 1. Get Product Variant Reviews

**Endpoint:** `GET /api/v1/products/:productVariantId/reviews`

**Query Parameters:**
- `page=1` - Page number
- `limit=10` - Items per page
- `sort_by=helpful_votes` - Sort field
- `sort_order=desc` - Sort order
- `min_rating=4` - Minimum rating filter
- `max_rating=5` - Maximum rating filter
- `verified_only=true` - Show only verified buyer reviews

**Example Request:**
```bash
GET /api/v1/products/60d5ecb74b24a1234567890a/reviews?page=1&limit=10&sort_by=helpful_votes&sort_order=desc&verified_only=true
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ecb74b24a1234567890b",
      "user_id": {
        "_id": "60d5ecb74b24a1234567890c",
        "name": "John Doe"
      },
      "rating": 5,
      "title": "Excellent Product Quality!",
      "review_text": "I've been using this product for 3 months now...",
      "is_verified_buyer": true,
      "helpful_votes": 12,
      "unhelpful_votes": 1,
      "reviewer_display_name": "John D.",
      "reviewer_location": "New York, NY",
      "image_urls": [
        "https://example.com/images/product-in-use.jpg"
      ],
      "createdAt": "2023-06-25T10:30:00.000Z",
      "totalVotes": 13,
      "helpfulPercentage": 92
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_items": 25,
    "items_per_page": 10,
    "has_next_page": true,
    "has_prev_page": false
  }
}
```

### 2. Get Product Rating Summary

**Endpoint:** `GET /api/v1/products/:productId/reviews/summary`

**Response:**
```json
{
  "success": true,
  "data": {
    "averageRating": 4.3,
    "totalReviews": 127,
    "verifiedReviews": 89,
    "ratingDistribution": {
      "1": 3,
      "2": 8,
      "3": 15,
      "4": 42,
      "5": 59
    }
  }
}
```

## Admin API Examples

### 1. Get All Reviews (Admin View)

**Endpoint:** `GET /api/v1/admin/reviews`

**Query Parameters:**
- `page=1` - Page number
- `limit=20` - Items per page
- `status=FLAGGED` - Filter by status
- `reported_only=true` - Show only reported reviews
- `verified_only=true` - Show only verified buyer reviews
- `search=spam` - Search in title and content
- `sort_by=reported_count` - Sort field
- `sort_order=desc` - Sort order

**Example Request:**
```bash
GET /api/v1/admin/reviews?status=FLAGGED&reported_only=true&page=1&limit=20
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ecb74b24a1234567890d",
      "user_id": {
        "_id": "60d5ecb74b24a1234567890e",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "product_variant_id": {
        "_id": "60d5ecb74b24a1234567890a",
        "name": "Premium Wireless Headphones - Black"
      },
      "rating": 1,
      "title": "Terrible product",
      "review_text": "This product is awful and a waste of money...",
      "status": "FLAGGED",
      "reported_count": 5,
      "helpful_votes": 0,
      "unhelpful_votes": 8,
      "is_verified_buyer": false,
      "moderated_at": "2023-06-25T12:00:00.000Z",
      "moderated_by": "60d5ecb74b24a1234567890f",
      "createdAt": "2023-06-24T15:30:00.000Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 2,
    "total_items": 12,
    "items_per_page": 20,
    "has_next_page": true,
    "has_prev_page": false
  }
}
```

### 2. Get Single Review (Admin View)

**Endpoint:** `GET /api/v1/admin/reviews/:reviewId`

**Response:**
```json
{
  "success": true,
  "data": {
    "review": {
      "_id": "60d5ecb74b24a1234567890d",
      "user_id": {
        "_id": "60d5ecb74b24a1234567890e",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "product_variant_id": {
        "_id": "60d5ecb74b24a1234567890a",
        "name": "Premium Wireless Headphones - Black"
      },
      "rating": 1,
      "title": "Terrible product",
      "review_text": "This product is awful and a waste of money...",
      "status": "FLAGGED",
      "reported_count": 5,
      "helpful_votes": 0,
      "unhelpful_votes": 8,
      "is_verified_buyer": false,
      "moderated_at": "2023-06-25T12:00:00.000Z",
      "moderated_by": {
        "_id": "60d5ecb74b24a1234567890f",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "createdAt": "2023-06-24T15:30:00.000Z"
    },
    "reports": [
      {
        "_id": "60d5ecb74b24a1234567890g",
        "reporter_user_id": {
          "_id": "60d5ecb74b24a1234567890h",
          "name": "Reporter User",
          "email": "reporter@example.com"
        },
        "reason": "FAKE_REVIEW",
        "custom_reason": "This review seems fake and malicious",
        "status": "PENDING",
        "createdAt": "2023-06-25T09:00:00.000Z"
      }
    ]
  }
}
```

### 3. Update Review Status

**Endpoint:** `PATCH /api/v1/admin/reviews/:reviewId/status`

**Request Body:**
```json
{
  "status": "REJECTED"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review status updated successfully",
  "data": {
    "id": "60d5ecb74b24a1234567890d",
    "status": "REJECTED",
    "moderated_at": "2023-06-25T14:30:00.000Z",
    "moderated_by": "60d5ecb74b24a1234567890f"
  }
}
```

### 4. Get All Reports

**Endpoint:** `GET /api/v1/admin/reports`

**Query Parameters:**
- `status=PENDING` - Filter by status
- `page=1` - Page number
- `limit=20` - Items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ecb74b24a1234567890g",
      "review_id": {
        "_id": "60d5ecb74b24a1234567890d",
        "rating": 1,
        "title": "Terrible product",
        "review_text": "This product is awful...",
        "product_variant_id": {
          "_id": "60d5ecb74b24a1234567890a",
          "name": "Premium Wireless Headphones - Black"
        },
        "user_id": {
          "_id": "60d5ecb74b24a1234567890e",
          "name": "Jane Smith",
          "email": "jane@example.com"
        },
        "status": "FLAGGED"
      },
      "reporter_user_id": {
        "_id": "60d5ecb74b24a1234567890h",
        "name": "Reporter User",
        "email": "reporter@example.com"
      },
      "reason": "FAKE_REVIEW",
      "custom_reason": "This review seems fake and malicious",
      "status": "PENDING",
      "createdAt": "2023-06-25T09:00:00.000Z",
      "daysSinceReported": 2
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_items": 8,
    "items_per_page": 20,
    "has_next_page": false,
    "has_prev_page": false
  }
}
```

### 5. Resolve Report

**Endpoint:** `PATCH /api/v1/admin/reports/:reportId/status`

**Request Body:**
```json
{
  "status": "RESOLVED",
  "resolution_notes": "Review has been flagged and user has been warned. Content violates community guidelines."
}
```

### 6. Get Report Statistics

**Endpoint:** `GET /api/v1/admin/reports/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "report_stats": {
      "PENDING": 15,
      "RESOLVED": 42,
      "REJECTED_REPORT": 8,
      "total": 65
    },
    "reason_stats": [
      {
        "reason": "FAKE_REVIEW",
        "count": 18
      },
      {
        "reason": "SPAM",
        "count": 12
      },
      {
        "reason": "ABUSIVE_LANGUAGE",
        "count": 8
      }
    ],
    "pending_by_age": [
      {
        "_id": 0,
        "count": 5
      },
      {
        "_id": 1,
        "count": 3
      },
      {
        "_id": 3,
        "count": 4
      },
      {
        "_id": 7,
        "count": 3
      }
    ],
    "most_reported_reviews": [
      {
        "_id": "60d5ecb74b24a1234567890d",
        "rating": 1,
        "title": "Terrible product",
        "reported_count": 5,
        "product_variant_id": {
          "_id": "60d5ecb74b24a1234567890a",
          "name": "Premium Wireless Headphones - Black"
        },
        "user_id": {
          "_id": "60d5ecb74b24a1234567890e",
          "name": "Jane Smith"
        }
      }
    ]
  }
}
```

## JavaScript/Node.js Examples

### Using Fetch API

```javascript
// Submit a review
async function submitReview(productVariantId, reviewData) {
  const response = await fetch('/api/v1/user/reviews', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      product_variant_id: productVariantId,
      ...reviewData
    })
  });
  
  const result = await response.json();
  return result;
}

// Get product reviews
async function getProductReviews(productVariantId, options = {}) {
  const params = new URLSearchParams(options);
  const response = await fetch(`/api/v1/products/${productVariantId}/reviews?${params}`);
  const result = await response.json();
  return result;
}

// Vote on a review
async function voteOnReview(reviewId, voteType) {
  const response = await fetch(`/api/v1/user/reviews/${reviewId}/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({ vote_type: voteType })
  });
  
  const result = await response.json();
  return result;
}

// Report a review
async function reportReview(reviewId, reason, customReason = null) {
  const response = await fetch(`/api/v1/user/reviews/${reviewId}/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      reason,
      custom_reason: customReason
    })
  });
  
  const result = await response.json();
  return result;
}
```

### Using Axios

```javascript
const axios = require('axios');

// Create axios instances
const userApi = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});

const adminApi = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});

// Submit review
async function submitReview(reviewData) {
  try {
    const response = await userApi.post('/user/reviews', reviewData);
    return response.data;
  } catch (error) {
    console.error('Error submitting review:', error.response.data);
    throw error;
  }
}

// Get admin reviews
async function getAdminReviews(filters = {}) {
  try {
    const response = await adminApi.get('/admin/reviews', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching admin reviews:', error.response.data);
    throw error;
  }
}

// Resolve report
async function resolveReport(reportId, resolutionNotes) {
  try {
    const response = await adminApi.patch(`/admin/reports/${reportId}/status`, {
      status: 'RESOLVED',
      resolution_notes: resolutionNotes
    });
    return response.data;
  } catch (error) {
    console.error('Error resolving report:', error.response.data);
    throw error;
  }
}
```

## Frontend Integration Examples

### React Component for Review Display

```jsx
import React, { useState, useEffect } from 'react';

const ProductReviews = ({ productVariantId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchReviews();
  }, [productVariantId]);

  const fetchReviews = async (page = 1) => {
    try {
      const response = await fetch(
        `/api/v1/products/${productVariantId}/reviews?page=${page}&limit=10&sort_by=helpful_votes&sort_order=desc`
      );
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (reviewId, voteType) => {
    try {
      const response = await fetch(`/api/v1/user/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ vote_type: voteType })
      });
      
      if (response.ok) {
        // Refresh reviews to show updated vote counts
        fetchReviews();
      }
    } catch (error) {
      console.error('Error voting on review:', error);
    }
  };

  if (loading) return <div>Loading reviews...</div>;

  return (
    <div className="product-reviews">
      <h3>Customer Reviews</h3>
      
      {reviews.map(review => (
        <div key={review._id} className="review-item">
          <div className="review-header">
            <div className="rating">
              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
            </div>
            <span className="reviewer-name">
              {review.reviewer_display_name || review.user_id.name}
            </span>
            {review.is_verified_buyer && (
              <span className="verified-badge">✓ Verified Buyer</span>
            )}
          </div>
          
          <h4 className="review-title">{review.title}</h4>
          <p className="review-text">{review.review_text}</p>
          
          {review.image_urls && review.image_urls.length > 0 && (
            <div className="review-images">
              {review.image_urls.map((url, index) => (
                <img key={index} src={url} alt={`Review image ${index + 1}`} />
              ))}
            </div>
          )}
          
          <div className="review-actions">
            <button onClick={() => handleVote(review._id, 'helpful')}>
              👍 Helpful ({review.helpful_votes})
            </button>
            <button onClick={() => handleVote(review._id, 'unhelpful')}>
              👎 Not Helpful ({review.unhelpful_votes})
            </button>
            <span className="review-date">
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
      
      {/* Pagination */}
      <div className="pagination">
        {pagination.has_prev_page && (
          <button onClick={() => fetchReviews(pagination.current_page - 1)}>
            Previous
          </button>
        )}
        <span>Page {pagination.current_page} of {pagination.total_pages}</span>
        {pagination.has_next_page && (
          <button onClick={() => fetchReviews(pagination.current_page + 1)}>
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
```

### Review Submission Form

```jsx
import React, { useState } from 'react';

const ReviewForm = ({ productVariantId, onReviewSubmitted }) => {
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    review_text: '',
    reviewer_display_name: '',
    reviewer_location: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/v1/user/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          product_variant_id: productVariantId,
          ...formData
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Review submitted successfully!');
        setFormData({
          rating: 5,
          title: '',
          review_text: '',
          reviewer_display_name: '',
          reviewer_location: ''
        });
        onReviewSubmitted && onReviewSubmitted();
      } else {
        alert('Error submitting review: ' + result.message);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error submitting review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="review-form">
      <h3>Write a Review</h3>
      
      <div className="form-group">
        <label>Rating:</label>
        <select 
          value={formData.rating} 
          onChange={(e) => setFormData({...formData, rating: parseInt(e.target.value)})}
          required
        >
          <option value={5}>5 Stars - Excellent</option>
          <option value={4}>4 Stars - Good</option>
          <option value={3}>3 Stars - Average</option>
          <option value={2}>2 Stars - Poor</option>
          <option value={1}>1 Star - Terrible</option>
        </select>
      </div>

      <div className="form-group">
        <label>Review Title:</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          maxLength={100}
          placeholder="Summarize your review"
        />
      </div>

      <div className="form-group">
        <label>Review:</label>
        <textarea
          value={formData.review_text}
          onChange={(e) => setFormData({...formData, review_text: e.target.value})}
          maxLength={2000}
          rows={5}
          placeholder="Tell others about your experience with this product"
          required
        />
      </div>

      <div className="form-group">
        <label>Display Name (optional):</label>
        <input
          type="text"
          value={formData.reviewer_display_name}
          onChange={(e) => setFormData({...formData, reviewer_display_name: e.target.value})}
          maxLength={50}
          placeholder="How should your name appear?"
        />
      </div>

      <div className="form-group">
        <label>Location (optional):</label>
        <input
          type="text"
          value={formData.reviewer_location}
          onChange={(e) => setFormData({...formData, reviewer_location: e.target.value})}
          maxLength={100}
          placeholder="e.g., New York, NY"
        />
      </div>

      <button type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
};

export default ReviewForm;
```

This completes the comprehensive Product Review System implementation with all API examples and frontend integration patterns!
