import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  jobTitle: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  profileUrl: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: (v: string) => v.startsWith('https://linkedin.com/in/'),
      message: 'Profile URL must start with https://linkedin.com/in/'
    }
  },
  searchQuery: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

export const Profile = mongoose.model('Profile', profileSchema);