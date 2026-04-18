const mongoose = require('mongoose');

const rescueCaseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a description']
  },
  animalType: {
    type: String,
    required: [true, 'Please specify the animal type']
  },
  location: {
    type: String,
    required: [true, 'Please provide a location']
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  incidentDate: {
    type: String,
    required: [true, 'Please provide the incident date'],
    default: () => new Date().toISOString()
  },
  status: {
    type: String,
    enum: ['Reported', 'Rescued', 'Recovering', 'Adopted', 'Resolved'],
    default: 'Reported'
  },
  imageUrl: {
    type: String,
    required: [true, 'Please provide an image']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RescueCase', rescueCaseSchema);
