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
  
  // Generate random users with mix of faker-generated and specific Indian names
  const indianFirstNames = [
    'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
    'Ananya', 'Diya', 'Aadhya', 'Kavya', 'Advika', 'Saanvi', 'Arya', 'Sara', 'Myra', 'Aanya',
    'Rahul', 'Amit', 'Rohit', 'Vikash', 'Suresh', 'Raj', 'Priya', 'Sunita', 'Neha', 'Pooja',
    'Ravi', 'Sandeep', 'Ajay', 'Deepak', 'Manoj', 'Shreya', 'Kavitha', 'Meera', 'Divya', 'Rekha'
  ];
  
  const indianLastNames = [
    'Sharma', 'Verma', 'Singh', 'Kumar', 'Gupta', 'Agarwal', 'Jain', 'Bansal', 'Malhotra', 'Chopra',
    'Patel', 'Shah', 'Mehta', 'Joshi', 'Desai', 'Reddy', 'Rao', 'Nair', 'Iyer', 'Menon',
    'Yadav', 'Mishra', 'Tiwari', 'Srivastava', 'Pandey', 'Chandra', 'Bhatia', 'Kapoor', 'Arora', 'Sethi'
  ];

  for (let i = 0; i < count - 2; i++) {
    let firstName, lastName;
    
    // Use specific Indian names 60% of the time, faker-generated 40% of the time
    if (faker.datatype.boolean({ probability: 0.6 })) {
      firstName = faker.helpers.arrayElement(indianFirstNames);
      lastName = faker.helpers.arrayElement(indianLastNames);
    } else {
      firstName = faker.person.firstName();
      lastName = faker.person.lastName();
    }
    
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
    
    const insertedUsers = [];
    const skippedUsers = [];
    
    // Insert users one by one to handle duplicates gracefully
    for (const userData of users) {
      try {
        const existingUser = await UserModel.findOne({ email: userData.email });
        if (existingUser) {
          skippedUsers.push(userData);
          console.log(`   ⚠️  Skipping duplicate email: ${userData.email}`);
          continue;
        }
        
        const user = new UserModel(userData);
        const savedUser = await user.save();
        insertedUsers.push(savedUser);
      } catch (error) {
        if (error.code === 11000) {
          skippedUsers.push(userData);
          console.log(`   ⚠️  Skipping duplicate: ${userData.email}`);
        } else {
          console.error(`   ❌ Failed to create user ${userData.email}:`, error.message);
        }
      }
    }
    
    // Count by role for inserted users only
    const adminCount = insertedUsers.filter(u => u.role === 'admin').length;
    const userCount = insertedUsers.filter(u => u.role === 'user').length;
    const activeCount = insertedUsers.filter(u => u.isActive).length;
    
    return {
      count: insertedUsers.length,
      summary: `${adminCount} admins, ${userCount} users, ${activeCount} active accounts (${skippedUsers.length} duplicates skipped)`
    };
    
  } catch (error) {
    throw new Error(`Failed to seed users: ${error.message}`);
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
