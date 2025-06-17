import mongoose from 'mongoose';

const pageViewSchema = new mongoose.Schema({
  path: String,
  timestamp: Date,
  duration: Number,
  isExit: Boolean,
  scrollDepth: Number,
});

const visitorSchema = new mongoose.Schema({
  sessionId: String,
  ip: String,
  userAgent: String,
  referrer: String,
  device: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'other'],
  },
  browser: String,
  country: String,
  firstVisit: Date,
  lastVisit: Date,
  visits: [pageViewSchema],
});

const viewsSchema = new mongoose.Schema(
  {
    pageViews: {
      type: Number,
      default: 0,
    },
    uniqueVisitors: {
      type: Number,
      default: 0,
    },
    bounceRate: {
      type: Number,
      default: 0,
    },
    avgSessionDuration: {
      type: Number,
      default: 0,
    },
    viewsByPage: {
      type: Map,
      of: {
        views: { type: Number, default: 0 },
        avgDuration: { type: Number, default: 0 },
        bounceRate: { type: Number, default: 0 },
        avgScrollDepth: { type: Number, default: 0 },
        originalPath: { type: String } // Added this field
      },
      default: () => new Map()
    },
    dailyStats: {
      type: Map,
      of: {
        views: { type: Number, default: 0 },
        visitors: { type: Number, default: 0 },
        bounceRate: { type: Number, default: 0 },
        avgDuration: { type: Number, default: 0 },
      },
      default: () => new Map(), // Use a function to return a new Map
    },
    deviceStats: {
      desktop: { type: Number, default: 0 },
      mobile: { type: Number, default: 0 },
      tablet: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    visitors: [visitorSchema],
  },
  {
    timestamps: true,
  }
);

const Views = mongoose.model('Views', viewsSchema);
export default Views;
