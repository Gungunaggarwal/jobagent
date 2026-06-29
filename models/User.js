import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      // Optional, as OAuth users (Google/Twitter) won't have a password
    },
    role: {
      type: String,
      enum: ['candidate', 'recruiter'],
      // Will be set during onboarding
    },
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
    // Flexible profile object to store answers from the onboarding flow
    profile: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Prevent re-compilation of the model if it already exists
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
