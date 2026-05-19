import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, INVITE_STATUS, BCRYPT_SALT_ROUNDS } from '../utils/constants.js';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Nama lengkap wajib diisi'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email wajib diisi'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password wajib diisi'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: [true, 'Role wajib dipilih'],
    },
    nim: {
      type: String,
      trim: true,
      default: null,
    },
    nidn: {
      type: String,
      trim: true,
      default: null,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    inviteStatus: {
      type: String,
      enum: [...Object.values(INVITE_STATUS), null],
      default: null,
    },
    avatar: {
      type: String,
      default: '',
    },
    fcmToken: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.index({ nim: 1 }, { unique: true, sparse: true, partialFilterExpression: { nim: { $type: 'string' } } });
userSchema.index({ nidn: 1 }, { unique: true, sparse: true, partialFilterExpression: { nidn: { $type: 'string' } } });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, BCRYPT_SALT_ROUNDS);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
