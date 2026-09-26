import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false
    },
    role:{
      type:String,
      enum:{
        values:['user','admin'],
        message:'{VALUE} is not a valid role'
      },
      default:'user',
      index:true
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s-]{10,15}$/, 'Please enter a valid phone number']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date
    },
    refreshToken: {
      type: String,
      select: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for bookings
UserSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'userId',
  justOne: false
});

UserSchema.index({ email: 1, isActive: 1 });
UserSchema.index({ role: 1, isActive: 1});

UserSchema.methods.toJSON=function(){
  const user=this.toObject({virtuals:true});
  delete user.passwordHash;
  delete user.refreshToken;
  delete user.__v;
  return user;
};

UserSchema.pre('save', async function () {

  if (!this.isModified('passwordHash')) {
    return;
  }

  const salt = await bcrypt.genSalt(12);

  this.passwordHash = await bcrypt.hash(
    this.passwordHash,
    salt
  );
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

UserSchema.statics.findByEmail = function (email) {
  return this.findOne({ email });
};

UserSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email }).select('+passwordHash');
};



export const User = mongoose.model('User', UserSchema);