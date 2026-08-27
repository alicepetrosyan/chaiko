import mongoose from 'mongoose';

const configSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'syrupOrder',
  },
  order: {
    type: [String],
    required: true,
    default: ['None', 'None', 'None', 'None'],
  },
}, {
  timestamps: true,
});

export default mongoose.model('Config', configSchema);
