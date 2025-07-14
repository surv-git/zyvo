/**
 * Category Seeder
 * Seeds sample categories for the e-commerce system
 */

/**
 * Seed categories
 */
const seed = async (CategoryModel) => {
  try {
    // Create all categories in the correct hierarchy order
    const categoryData = [
      // Root categories
      {
        name: 'Electronics',
        description: 'Electronic devices and accessories',
        slug: 'electronics',
        parent_category: null,
        image_url: 'https://example.com/images/electronics.jpg',
        is_active: true
      },
      {
        name: 'Clothing',
        description: 'Apparel and fashion items',
        slug: 'clothing',
        parent_category: null,
        image_url: 'https://example.com/images/clothing.jpg',
        is_active: true
      },
      {
        name: 'Home & Garden',
        description: 'Home improvement and gardening supplies',
        slug: 'home-garden',
        parent_category: null,
        image_url: 'https://example.com/images/home-garden.jpg',
        is_active: true
      }
    ];

    // Create root categories first
    const createdRootCategories = await CategoryModel.insertMany(categoryData);
    
    // Map category names to IDs for hierarchy setup
    const categoryMap = {};
    createdRootCategories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });
    
    // Create child categories
    const childCategories = [
      {
        name: 'Computers',
        description: 'Desktop computers, laptops, and accessories',
        slug: 'computers',
        parent_category: categoryMap['Electronics'],
        image_url: 'https://example.com/images/computers.jpg',
        is_active: true
      },
      {
        name: 'Smartphones',
        description: 'Mobile phones and accessories',
        slug: 'smartphones',
        parent_category: categoryMap['Electronics'],
        image_url: 'https://example.com/images/smartphones.jpg',
        is_active: true
      },
      {
        name: 'Audio',
        description: 'Headphones, speakers, and audio equipment',
        slug: 'audio',
        parent_category: categoryMap['Electronics'],
        image_url: 'https://example.com/images/audio.jpg',
        is_active: true
      },
      {
        name: 'Men\'s Clothing',
        description: 'Clothing for men',
        slug: 'mens-clothing',
        parent_category: categoryMap['Clothing'],
        image_url: 'https://example.com/images/mens-clothing.jpg',
        is_active: true
      },
      {
        name: 'Women\'s Clothing',
        description: 'Clothing for women',
        slug: 'womens-clothing',
        parent_category: categoryMap['Clothing'],
        image_url: 'https://example.com/images/womens-clothing.jpg',
        is_active: true
      }
    ];
    
    const createdChildCategories = await CategoryModel.insertMany(childCategories);
    
    // Update category map with child categories
    createdChildCategories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });
    
    // Create grandchild categories
    const grandchildCategories = [
      {
        name: 'Laptops',
        description: 'Portable computers and notebooks',
        slug: 'laptops',
        parent_category: categoryMap['Computers'],
        image_url: 'https://example.com/images/laptops.jpg',
        is_active: true
      },
      {
        name: 'Headphones',
        description: 'Headphones and earbuds',
        slug: 'headphones',
        parent_category: categoryMap['Audio'],
        image_url: 'https://example.com/images/headphones.jpg',
        is_active: true
      }
    ];
    
    const createdGrandchildCategories = await CategoryModel.insertMany(grandchildCategories);
    
    const totalCount = createdRootCategories.length + createdChildCategories.length + createdGrandchildCategories.length;
    
    return {
      count: totalCount,
      summary: `Created ${createdRootCategories.length} root categories, ${createdChildCategories.length} child categories, and ${createdGrandchildCategories.length} grandchild categories`
    };
    
  } catch (error) {
    throw new Error(`Failed to seed categories: ${error.message}`);
  }
};

module.exports = {
  seed
};
