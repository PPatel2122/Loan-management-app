const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, default: 'Admin' },
  email: { type: String, required: true, unique: true, default: 'admin@example.com' },
  phone: { type: String, required: false },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'Admin' },
  profilePhoto: { type: String, default: '' },
  employeeId: { type: String, unique: true, sparse: true }
}, { timestamps: true });

// Pre-save hook to hash password and auto-generate employeeId
userSchema.pre('save', async function() {
  // Generate employeeId if not present or invalid
  if (!this.employeeId || this.employeeId === 'undefined' || this.employeeId === 'null' || this.employeeId === '') {
    const prefix = this.role === 'Admin' ? 'ADM' : 'EMP';
    const regex = new RegExp(`^${prefix}-\\d+$`);
    
    // Find all users with this role's prefix
    const users = await mongoose.model('User').find({ employeeId: regex });
    
    let maxNum = 0;
    users.forEach(u => {
      const parts = u.employeeId.split('-');
      const num = parseInt(parts[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    });
    
    this.employeeId = `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
  }
  
  // Hash password if modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
