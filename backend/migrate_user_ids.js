require('./config/env');
const mongoose = require('mongoose');
const User = require('./models/User');

const migrateUserIds = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Database connected.');

    const allUsers = await User.find({});
    console.log(`Found ${allUsers.length} total users in database.`);

    const usersToMigrate = allUsers.filter(u => 
      !u.employeeId || 
      u.employeeId === 'undefined' || 
      u.employeeId === 'null' || 
      u.employeeId === ''
    );

    console.log(`Found ${usersToMigrate.length} users requiring ID generation.`);

    if (usersToMigrate.length === 0) {
      console.log('No migration needed. All users already have valid IDs.');
      process.exit(0);
    }

    for (const user of usersToMigrate) {
      console.log(`Generating ID for User: ${user.username} (Role: ${user.role})...`);
      // Calling user.save() will trigger the pre-save hook which automatically
      // handles sequential ID generation and ignores password hashing if not modified.
      const savedUser = await user.save();
      console.log(`Saved User: ${savedUser.username} with ID: ${savedUser.employeeId}`);
    }

    console.log('All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateUserIds();
