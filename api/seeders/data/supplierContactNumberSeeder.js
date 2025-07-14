/**
 * Supplier Contact Number Seeder
 * Seeds contact numbers for suppliers
 */

/**
 * Seed supplier contact numbers
 */
const seed = async (SupplierContactNumberModel) => {
  try {
    // Get reference models for relationships
    const Supplier = require('../../models/Supplier');
    
    // Get all suppliers to create contact numbers for
    const suppliers = await Supplier.find();
    
    if (!suppliers || suppliers.length === 0) {
      throw new Error('Suppliers must be seeded before supplier contact numbers. Please run: node seeders/seeder.js seed suppliers');
    }

    const contactNumberData = [];

    // Add multiple contact numbers for each supplier
    suppliers.forEach((supplier, index) => {
      // Primary contact number for each supplier
      contactNumberData.push({
        supplier_id: supplier._id,
        contact_number: generatePhoneNumber(index * 3 + 1),
        contact_name: `${supplier.name} Main Office`,
        type: 'Landline',
        extension: null,
        notes: 'Main contact number for orders and inquiries',
        is_primary: true,
        is_active: true
      });

      // Secondary contact numbers for active suppliers
      if (supplier.is_active) {
        // Mobile contact
        contactNumberData.push({
          supplier_id: supplier._id,
          contact_number: generatePhoneNumber(index * 3 + 2),
          contact_name: `${supplier.name} Sales Manager`,
          type: 'Mobile',
          extension: null,
          notes: 'Direct mobile line for sales inquiries',
          is_primary: false,
          is_active: true
        });

        // Support contact for premium suppliers (rating >= 0.2)
        if (supplier.rating >= 0.2) {
          contactNumberData.push({
            supplier_id: supplier._id,
            contact_number: generatePhoneNumber(index * 3 + 3),
            contact_name: `${supplier.name} Support Team`,
            type: 'Toll-Free',
            extension: null,
            notes: 'Customer support and technical assistance',
            is_primary: false,
            is_active: true
          });
        }

        // WhatsApp contact for high-volume suppliers
        if (['TechSupply Corp', 'Fashion Forward Inc', 'Premium Accessories Co'].includes(supplier.name)) {
          contactNumberData.push({
            supplier_id: supplier._id,
            contact_number: generatePhoneNumber(index * 3 + 4),
            contact_name: `${supplier.name} Emergency Contact`,
            type: 'Whatsapp',
            extension: null,
            notes: '24/7 emergency contact for urgent orders',
            is_primary: false,
            is_active: true
          });
        }
      } else {
        // Inactive contact number for inactive suppliers
        contactNumberData.push({
          supplier_id: supplier._id,
          contact_number: generatePhoneNumber(index * 3 + 2),
          contact_name: `${supplier.name} Old Contact`,
          type: 'Other',
          extension: null,
          notes: 'Inactive contact number',
          is_primary: false,
          is_active: false
        });
      }
    });

    const createdContactNumbers = await SupplierContactNumberModel.insertMany(contactNumberData);

    return {
      count: createdContactNumbers.length,
      summary: `Created ${createdContactNumbers.length} contact numbers for ${suppliers.length} suppliers`,
      breakdown: {
        primary: createdContactNumbers.filter(c => c.is_primary).length,
        mobile: createdContactNumbers.filter(c => c.type === 'Mobile').length,
        landline: createdContactNumbers.filter(c => c.type === 'Landline').length,
        tollFree: createdContactNumbers.filter(c => c.type === 'Toll-Free').length,
        whatsapp: createdContactNumbers.filter(c => c.type === 'Whatsapp').length,
        other: createdContactNumbers.filter(c => c.type === 'Other').length,
        active: createdContactNumbers.filter(c => c.is_active).length,
        inactive: createdContactNumbers.filter(c => !c.is_active).length
      },
      data: createdContactNumbers
    };

  } catch (error) {
    throw {
      message: `Failed to seed supplier contact numbers: ${error.message}`,
      details: error
    };
  }
};

/**
 * Generate a realistic phone number based on index
 */
function generatePhoneNumber(index) {
  const areaCodes = ['415', '212', '503', '512', '310', '312', '555'];
  const areaCode = areaCodes[index % areaCodes.length];
  const exchange = String(555 + (index % 100)).padStart(3, '0');
  const number = String(1000 + (index * 123) % 9000).padStart(4, '0');
  
  return `1${areaCode}${exchange}${number}`;
}

module.exports = {
  seed
};
