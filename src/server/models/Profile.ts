// import mongoose from 'mongoose';

// const profileSchema = new mongoose.Schema({
//   fullName: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   jobTitle: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   company: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   location: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   profileUrl: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true,
//     validate: {
//       validator: (v: string) => v.startsWith('https://linkedin.com/in/'),
//       message: 'Profile URL must start with https://linkedin.com/in/'
//     }
//   },
//   searchQuery: {
//     type: String,
//     required: true,
//     trim: true
//   }
// }, {
//   timestamps: true
// });

// export const Profile = mongoose.model('Profile', profileSchema);

import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: false
  },
  jobTitle: {
    type: String,
    required: false
  },
  company: {
    type: String,
    required: false
  },
  location: {
    type: String,
    required: false
  },
  profileUrl: {
    type: String,
    required: false,
    // unique: true
  },
  searchQuery: {
    type: String,
    required: false
  },
  lastScraped: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  searchUrl: {
    type: String,
    required: false
  },
  password: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: false
  },
});

export const Profile = mongoose.model('Profile', profileSchema);