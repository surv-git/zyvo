/**
 * User Seeder
 * Seeds user accounts with various roles and realistic data
 */

const bcrypt = require('bcrypt');
// const { faker } = require('@faker-js/faker');
// If you want to use a specific locale like Indian English, uncomment the line below:
const { faker } = require('@faker-js/faker/locale/en_IN');

/**
 * Generate sample users with realistic data
 */
const generateUsers = async (count = 50) => {
  const users = [];
  
  // Create admin user
  const adminUser = {
    name: 'Administrator',
    email: 'admin@zyvo.com',
    password: await bcrypt.hash('admin123', 12),
    role: 'admin',
    isActive: true,
    lastLogin: new Date()
  };
  users.push(adminUser);
  
  // Create test user
  const testUser = {
    name: 'Test User',
    email: 'test@zyvo.com',
    password: await bcrypt.hash('test123', 12),
    role: 'user',
    isActive: true,
    lastLogin: faker.date.recent({ days: 7 })
  };
  users.push(testUser);
  
  // Generate random users
  for (let i = 0; i < count - 2; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    
    const user = {
      name: `${firstName} ${lastName}`,
      email,
      password: await bcrypt.hash('password123', 12),
      role: faker.helpers.weightedArrayElement([
        { weight: 90, value: 'user' },
        { weight: 10, value: 'admin' }
      ]),
      isActive: faker.helpers.weightedArrayElement([
        { weight: 85, value: true },
        { weight: 15, value: false }
      ]),
      lastLogin: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), { probability: 0.7 })
    };
    
    users.push(user);
  }
  
  return users;
};

/**
 * Seed users table
 */
const seed = async (UserModel) => {
  try {
    console.log('   📝 Generating user data...');
    const users = await generateUsers(50);
    
    console.log('   💾 Inserting users into database...');
    const result = await UserModel.insertMany(users);
    
    // Count by role
    const adminCount = result.filter(u => u.role === 'admin').length;
    const userCount = result.filter(u => u.role === 'user').length;
    const activeCount = result.filter(u => u.isActive).length;
    
    return {
      count: result.length,
      summary: `${adminCount} admins, ${userCount} users, ${activeCount} active accounts`
    };
    
  } catch (error) {
    if (error.code === 11000) {
      // Handle duplicate key error
      const duplicateField = Object.keys(error.keyPattern)[0];
      throw new Error(`Duplicate ${duplicateField} found. Some users may already exist.`);
    }
    throw error;
  }
};

/**
 * Clean users table
 */
const clean = async (UserModel) => {
  const count = await UserModel.countDocuments();
  await UserModel.deleteMany({});
  return { count };
};

/**
 * Get sample user data for testing
 */
const getSampleUsers = () => {
  return [
    {
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'user',
      isActive: true
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'admin',
      isActive: true
    },
    {
      name: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      role: 'user',
      isActive: false
    }
  ];
};

module.exports = {
  seed,
  clean,
  getSampleUsers,
  generateUsers
};
