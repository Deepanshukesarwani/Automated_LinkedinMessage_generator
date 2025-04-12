import mongoose from 'mongoose';

export enum CampaignStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DELETED = 'DELETED'
}

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(CampaignStatus),
    default: CampaignStatus.INACTIVE
  },
  leads: [
    {
      type: String,
      validate: {
        validator: (v: string) =>
          /^https:\/\/(www\.)?linkedin\.com\/in\//.test(v),
        message: 'LinkedIn URL must start with https://linkedin.com/in/',
      },
    },
  ],
  accountIDs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  }]
}, {
  timestamps: true
});

export const Campaign = mongoose.model('Campaign', campaignSchema);