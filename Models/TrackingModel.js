import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema({
  sessionId: String,
  ip: String,
  userAgent: String,
  firstVisit: Date,
  lastVisit: Date,
  visits: [{
    page: String,
    timestamp: Date
  }]
});

const statisticsSchema = new mongoose.Schema({
  pageViews: {
    type: Number,
    default: 0
  },
  uniqueVisitors: {
    type: Number,
    default: 0
  },
  viewsByPage: {
    type: Map,
    of: Number,
    default: new Map()
  },
  dailyViews: {
    type: Map,
    of: Number,
    default: new Map()
  },
  visitors: [visitorSchema]
}, {
  timestamps: true
});

const Statistics = mongoose.model('Statistics', statisticsSchema);
export default Statistics;