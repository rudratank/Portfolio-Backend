import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp: { type: Number },
  otpExpires: { type: Date },
  isAdminActive: { type: Boolean, default: true  },
  failedLoginAttempts: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false },
  lockExpires: { type: Date },
  lastSuccessfulLogin: { type: Date },
  lastLogout: { type: Date }
});

const Admin = mongoose.model('Admin', AdminSchema);
export default Admin;
