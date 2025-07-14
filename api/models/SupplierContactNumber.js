/**
 * SupplierContactNumber Model
 * Mongoose schema and model for managing multiple contact numbers per supplier
 * Handles phone numbers, contact persons, and contact types separately from Supplier
 */

const mongoose = require('mongoose');

const supplierContactNumberSchema = new mongoose.Schema({
  // Foreign Key Reference
  supplier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier ID is required'],
    index: true
  },

  // Contact Information
  contact_number: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
    maxlength: [20, 'Contact number cannot exceed 20 characters'],
    minlength: [7, 'Contact number must be at least 7 characters'],
    index: true,
    validate: {
      validator: function(phone) {
        // Basic phone number validation - allows various formats
        return /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)\.]/g, ''));
      },
      message: 'Contact number must be a valid phone number'
    }
  },
  contact_name: {
    type: String,
    trim: true,
    maxlength: [100, 'Contact name cannot exceed 100 characters'],
    default: null,
    index: true
  },
  type: {
    type: String,
    enum: {
      values: ['Mobile', 'Landline', 'Fax', 'Whatsapp', 'Toll-Free', 'Other'],
      message: 'Type must be one of: Mobile, Landline, Fax, Whatsapp, Toll-Free, Other'
    },
    default: 'Mobile', // Default is now Mobile as requested
    index: true
  },
  extension: {
    type: String,
    trim: true,
    maxlength: [10, 'Extension cannot exceed 10 characters'],
    default: null,
    validate: {
      validator: function(ext) {
        return !ext || /^\d+$/.test(ext);
      },
      message: 'Extension must contain only numbers'
    }
  },

  // Primary Contact Flag
  is_primary: {
    type: Boolean,
    default: false,
    index: true
  },

  // Additional Information
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    default: null
  },

  // Status and Timestamps
  is_active: {
    type: Boolean,
    default: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false, // We're managing timestamps manually
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
supplierContactNumberSchema.index({ supplier_id: 1 });
supplierContactNumberSchema.index({ contact_number: 1 });
supplierContactNumberSchema.index({ contact_name: 1 });
supplierContactNumberSchema.index({ is_primary: 1 });
supplierContactNumberSchema.index({ is_active: 1 });
supplierContactNumberSchema.index({ type: 1 });

// Compound indexes for common query patterns
supplierContactNumberSchema.index({ supplier_id: 1, is_active: 1 });
supplierContactNumberSchema.index({ supplier_id: 1, is_primary: -1 });
supplierContactNumberSchema.index({ supplier_id: 1, type: 1 });
supplierContactNumberSchema.index({ is_active: 1, type: 1 });
supplierContactNumberSchema.index({ supplier_id: 1, is_primary: -1, createdAt: -1 });

// Unique compound index to prevent duplicate contact numbers for same supplier
supplierContactNumberSchema.index(
  { supplier_id: 1, contact_number: 1 }, 
  { 
    unique: true,
    name: 'unique_supplier_contact_number'
  }
);

// Virtual fields
supplierContactNumberSchema.virtual('formatted_number').get(function() {
  if (!this.contact_number) return null;
  
  // Basic formatting for display
  const number = this.contact_number.replace(/[\s\-\(\)\.]/g, '');
  if (number.length === 10) {
    return `(${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
  }
  return this.contact_number;
});

supplierContactNumberSchema.virtual('full_contact_info').get(function() {
  let info = this.formatted_number;
  if (this.extension) {
    info += ` ext. ${this.extension}`;
  }
  if (this.contact_name) {
    info += ` (${this.contact_name})`;
  }
  return info;
});

// Pre-save middleware to handle primary contact logic and timestamps
supplierContactNumberSchema.pre('save', async function(next) {
  try {
    // Update timestamp
    this.updatedAt = new Date();
    
    // Handle primary contact logic
    if (this.is_primary && (this.isNew || this.isModified('is_primary'))) {
      // Set all other contacts for this supplier to non-primary
      await this.constructor.updateMany(
        { 
          supplier_id: this.supplier_id, 
          _id: { $ne: this._id },
          is_active: true
        },
        { 
          $set: { 
            is_primary: false,
            updatedAt: new Date()
          }
        }
      );
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Static methods for common queries
supplierContactNumberSchema.statics.findBySupplier = function(supplierId, includeInactive = false) {
  const query = { supplier_id: supplierId };
  
  if (!includeInactive) {
    query.is_active = true;
  }
  
  return this.find(query)
    .sort({ is_primary: -1, type: 1, createdAt: -1 })
    .populate('supplier_id', 'name slug email');
};

supplierContactNumberSchema.statics.findPrimaryContact = function(supplierId) {
  return this.findOne({ 
    supplier_id: supplierId, 
    is_primary: true, 
    is_active: true 
  }).populate('supplier_id', 'name slug email');
};

supplierContactNumberSchema.statics.findByType = function(type, includeInactive = false) {
  const query = { type };
  
  if (!includeInactive) {
    query.is_active = true;
  }
  
  return this.find(query)
    .sort({ supplier_id: 1, is_primary: -1, createdAt: -1 })
    .populate('supplier_id', 'name slug email');
};

supplierContactNumberSchema.statics.searchContacts = function(searchTerm, includeInactive = false) {
  const query = {
    $or: [
      { contact_number: { $regex: searchTerm, $options: 'i' } },
      { contact_name: { $regex: searchTerm, $options: 'i' } }
    ]
  };
  
  if (!includeInactive) {
    query.is_active = true;
  }
  
  return this.find(query)
    .sort({ supplier_id: 1, is_primary: -1, createdAt: -1 })
    .populate('supplier_id', 'name slug email');
};

supplierContactNumberSchema.statics.findActiveContacts = function() {
  return this.find({ is_active: true })
    .sort({ supplier_id: 1, is_primary: -1, createdAt: -1 })
    .populate('supplier_id', 'name slug email');
};

// Instance methods
supplierContactNumberSchema.methods.softDelete = function() {
  this.is_active = false;
  this.updatedAt = new Date();
  return this.save();
};

supplierContactNumberSchema.methods.activate = function() {
  this.is_active = true;
  this.updatedAt = new Date();
  return this.save();
};

supplierContactNumberSchema.methods.setPrimary = async function() {
  // First, set all other contacts for this supplier to non-primary
  await this.constructor.updateMany(
    { 
      supplier_id: this.supplier_id, 
      _id: { $ne: this._id },
      is_active: true
    },
    { 
      $set: { 
        is_primary: false,
        updatedAt: new Date()
      }
    }
  );
  
  // Then set this contact as primary
  this.is_primary = true;
  this.updatedAt = new Date();
  return this.save();
};

supplierContactNumberSchema.methods.updateContactInfo = function(contactData) {
  const { contact_number, contact_name, type, extension, notes } = contactData;
  
  if (contact_number !== undefined) this.contact_number = contact_number;
  if (contact_name !== undefined) this.contact_name = contact_name;
  if (type !== undefined) this.type = type;
  if (extension !== undefined) this.extension = extension;
  if (notes !== undefined) this.notes = notes;
  
  this.updatedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('SupplierContactNumber', supplierContactNumberSchema);
