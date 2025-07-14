/**
 * Supplier Seeder
 * Seeds sample suppliers for the e-commerce system
 */

/**
 * Seed suppliers
 */
const seed = async (SupplierModel) => {
  try {
    const supplierData = [
      {
        name: 'TechSupply Corp',
        description: 'Leading technology supplier specializing in electronics and computer hardware',
        slug: 'techsupply-corp',
        email: 'contact@techsupply.com',
        website: 'https://www.techsupply.com',
        address: {
          address_line_1: '123 Tech Street',
          address_line_2: 'Suite 400',
          city: 'San Francisco',
          state: 'CA',
          zipcode: '94102',
          country: 'USA'
        },
        rating: 0,
        payment_terms: 'Net 30 days',
        delivery_terms: 'FOB destination, 3-5 business days',
        status: 'Active',
        notes: 'Preferred supplier for electronics. Excellent quality and timely delivery.',
        is_active: true
      },
      {
        name: 'Fashion Forward Inc',
        description: 'Premium fashion and apparel supplier with global reach',
        slug: 'fashion-forward-inc',
        email: 'orders@fashionforward.com',
        website: 'https://www.fashionforward.com',
        address: {
          address_line_1: '456 Fashion Ave',
          city: 'New York',
          state: 'NY',
          zipcode: '10001',
          country: 'USA'
        },
        rating: 0.1,
        payment_terms: 'Net 15 days',
        delivery_terms: 'FOB origin, 7-10 business days',
        status: 'Active',
        notes: 'Great for trendy fashion items. Good variety and competitive pricing.',
        is_active: true
      },
      {
        name: 'HomeComfort Supplies',
        description: 'Comprehensive home and garden supplier with eco-friendly options',
        slug: 'homecomfort-supplies',
        email: 'info@homecomfort.com',
        website: 'https://www.homecomfort.com',
        address: {
          address_line_1: '789 Garden Blvd',
          city: 'Portland',
          state: 'OR',
          zipcode: '97201',
          country: 'USA'
        },
        rating: 0.2,
        payment_terms: 'Net 45 days',
        delivery_terms: 'FOB destination, 5-7 business days',
        status: 'Active',
        notes: 'Specializes in sustainable and eco-friendly home products.',
        is_active: true
      },
      {
        name: 'Global Electronics Ltd',
        description: 'International electronics distributor with competitive pricing',
        slug: 'global-electronics-ltd',
        email: 'sales@globalelectronics.com',
        website: 'https://www.globalelectronics.com',
        address: {
          address_line_1: '321 Commerce St',
          city: 'Austin',
          state: 'TX',
          zipcode: '78701',
          country: 'USA'
        },
        rating: 0,
        payment_terms: 'Net 30 days',
        delivery_terms: 'FOB origin, 3-5 business days',
        status: 'Active',
        notes: 'Good backup supplier for electronics. Competitive pricing but longer lead times.',
        is_active: true
      },
      {
        name: 'Premium Accessories Co',
        description: 'High-end accessories and luxury goods supplier',
        slug: 'premium-accessories-co',
        email: 'contact@premiumaccessories.com',
        website: 'https://www.premiumaccessories.com',
        address: {
          address_line_1: '555 Luxury Lane',
          city: 'Beverly Hills',
          state: 'CA',
          zipcode: '90210',
          country: 'USA'
        },
        rating: 0,
        payment_terms: 'Net 15 days',
        delivery_terms: 'White glove delivery, 1-3 business days',
        status: 'Active',
        notes: 'Premium supplier for high-end products. Excellent customer service.',
        is_active: true
      },
      {
        name: 'Budget Wholesale Hub',
        description: 'Cost-effective supplier for budget-friendly products',
        slug: 'budget-wholesale-hub',
        email: 'orders@budgethub.com',
        website: 'https://www.budgethub.com',
        address: {
          address_line_1: '999 Warehouse Way',
          city: 'Chicago',
          state: 'IL',
          zipcode: '60601',
          country: 'USA'
        },
        rating: 0,
        payment_terms: 'Net 60 days',
        delivery_terms: 'FOB origin, 7-14 business days',
        status: 'Active',
        notes: 'Good for budget items. Quality varies but prices are competitive.',
        is_active: true
      },
      {
        name: 'Inactive Supplier Example',
        description: 'Example of an inactive supplier for testing purposes',
        slug: 'inactive-supplier-example',
        email: 'old@inactivesupplier.com',
        address: {
          address_line_1: '000 Closed St',
          city: 'Anywhere',
          state: 'XX',
          zipcode: '00000',
          country: 'USA'
        },
        rating: 0,
        payment_terms: 'Net 30 days',
        delivery_terms: 'Standard shipping',
        status: 'Inactive',
        notes: 'Supplier discontinued. Kept for historical records.',
        is_active: false
      }
    ];

    const createdSuppliers = await SupplierModel.insertMany(supplierData);

    return {
      count: createdSuppliers.length,
      summary: `Created ${createdSuppliers.length} suppliers (${createdSuppliers.filter(s => s.is_active).length} active, ${createdSuppliers.filter(s => !s.is_active).length} inactive)`,
      data: createdSuppliers
    };

  } catch (error) {
    throw {
      message: `Failed to seed suppliers: ${error.message}`,
      details: error
    };
  }
};

module.exports = {
  seed
};
