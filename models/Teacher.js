const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      match: [/^\d{11}$/, 'Phone number must be exactly 11 digits']
    },

    passwordHash: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ['admin', 'teacher', 'serviceLeader'],
      default: 'teacher'
    },

    assignedClass: {
      type: String,
      enum: ['Department A', 'Department B', 'Department C', 'Upper Primary', 'Middle School'],
      required: function () {
        return this.role === 'teacher' || this.role === 'serviceLeader';
      }
    },

    assignedGender: {
      type: String,
      enum: ['male', 'female', 'all'],
      default: 'all'
    },

    assignedYear: {
      type: String,
      required: function () {
        return this.role === 'teacher';
      },
      enum: [
        'Grade 1',
        'Grade 2',
        'Grade 3',
        'Grade 4',
        'Grade 5',
        'Grade 6',
        'Grade 7',
        'Grade 8',
        'Grade 9'
      ]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Teacher', teacherSchema);