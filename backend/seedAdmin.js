require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const userExists = await User.findOne({ username: 'admin' });
    if (userExists) {
      console.log('Admin user already exists');
      process.exit();
    }

    await User.create({
      username: 'admin',
      password: 'password123',
      role: 'Admin'
    });

    console.log('Admin user created (admin / password123)');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedAdmin();
