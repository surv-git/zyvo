# Favorites API Examples

## User Endpoints (Authentication Required)

### Add to Favorites
```bash
POST /api/v1/user/favorites
Authorization: Bearer <token>
Content-Type: application/json

{
  "product_variant_id": "60d5ecb74b24a1234567890a",
  "user_notes": "Love this product!"
}
```

### Get My Favorites
```bash
GET /api/v1/user/favorites?page=1&limit=10&sort_by=added_at&sort_order=desc
Authorization: Bearer <token>
```

### Remove from Favorites
```bash
DELETE /api/v1/user/favorites/60d5ecb74b24a1234567890a
Authorization: Bearer <token>
```

### Update Notes
```bash
PATCH /api/v1/user/favorites/60d5ecb74b24a1234567890a/notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_notes": "Updated notes"
}
```

### Check if Favorited
```bash
GET /api/v1/user/favorites/60d5ecb74b24a1234567890a/check
Authorization: Bearer <token>
```

### Get Statistics
```bash
GET /api/v1/user/favorites/stats
Authorization: Bearer <token>
```

### Bulk Add
```bash
POST /api/v1/user/favorites/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "product_variant_ids": ["id1", "id2", "id3"],
  "user_notes": "Bulk added"
}
```

## Public Endpoints

### Most Popular Favorites
```bash
GET /api/v1/favorites/popular?limit=10
```

## JavaScript Examples

```javascript
// Add to favorites
const addFavorite = async (productVariantId, notes) => {
  const response = await fetch('/api/v1/user/favorites', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      product_variant_id: productVariantId,
      user_notes: notes
    })
  });
  return response.json();
};

// Get favorites
const getFavorites = async (page = 1) => {
  const response = await fetch(`/api/v1/user/favorites?page=${page}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Remove favorite
const removeFavorite = async (productVariantId) => {
  const response = await fetch(`/api/v1/user/favorites/${productVariantId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.status === 204;
};
```

## React Component Example

```jsx
const FavoriteButton = ({ productVariantId }) => {
  const [isFavorited, setIsFavorited] = useState(false);

  const toggleFavorite = async () => {
    if (isFavorited) {
      await removeFavorite(productVariantId);
      setIsFavorited(false);
    } else {
      await addFavorite(productVariantId);
      setIsFavorited(true);
    }
  };

  return (
    <button onClick={toggleFavorite}>
      {isFavorited ? '❤️ Favorited' : '🤍 Add to Favorites'}
    </button>
  );
};
```
