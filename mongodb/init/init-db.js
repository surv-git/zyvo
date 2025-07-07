// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to the zyvo database
db = db.getSiblingDB('zyvo');

// Create collections for each service
db.createCollection('service1_data');
db.createCollection('service2_data');
db.createCollection('service3_data');
db.createCollection('service4_data');
db.createCollection('shared_data');

// Create indexes for better performance
db.service1_data.createIndex({ "createdAt": 1 });
db.service2_data.createIndex({ "createdAt": 1 });
db.service3_data.createIndex({ "createdAt": 1 });
db.service4_data.createIndex({ "createdAt": 1 });
db.shared_data.createIndex({ "type": 1, "createdAt": 1 });

// Insert sample data
db.service1_data.insertOne({
    name: "Service 1 Sample",
    type: "test",
    status: "active",
    createdAt: new Date()
});

db.service2_data.insertOne({
    name: "Service 2 Sample",
    type: "test",
    status: "active",
    createdAt: new Date()
});

db.service3_data.insertOne({
    name: "Service 3 Sample",
    type: "test",
    status: "active",
    createdAt: new Date()
});

db.service4_data.insertOne({
    name: "Service 4 Sample",
    type: "test",
    status: "active",
    createdAt: new Date()
});

print("Database initialization completed successfully!");
