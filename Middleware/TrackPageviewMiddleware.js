// TrackPageviewMiddleware.js
import Statistics from "../Models/TrackingModel.js";
import { isAdminPath } from '../utils/PathUtils.js';
import {UAParser} from 'ua-parser-js';
import geoip from 'geoip-lite';
import Views from "../Models/ViewsModel.js";

// TrackPageviewMiddleware.js
export const trackPageView = async (req, res, next) => {
  try {
    const userAgent = req.get('user-agent');
    if (!userAgent || isBot(userAgent)) {
      return next();
    }

    // Generate a session ID if not exists
    if (!req.session?.id) {
      req.session = { id: Math.random().toString(36).substring(7) };
    }

    const sessionId = req.session?.id;
    const parser = new UAParser(userAgent);
    const browserInfo = parser.getBrowser();
    const deviceInfo = parser.getDevice();
    const ip = req.ip || req.connection.remoteAddress;
    const geo = ip === '::1' || ip === '127.0.0.1' 
      ? { country: 'Local' } 
      : geoip.lookup(ip);
    
    // Encode path to make it safe for Mongoose Map
    const currentPath = req.path;
    const encodedPath = encodeURIComponent(currentPath).replace(/\./g, '%2E');
    
    const timestamp = new Date();

    let views = await Views.findOne();
    if (!views) {
      views = new Views();
    }

    // Update daily stats
    const today = timestamp.toISOString().split('T')[0];
    const dailyStats = views.dailyStats.get(today) || { views: 0, visitors: 0 };
    dailyStats.views += 1;
    views.dailyStats.set(today, dailyStats);

    const deviceType = deviceInfo.type || 
      (userAgent.toLowerCase().includes('mobile') ? 'mobile' : 'desktop');

    // Update device stats
    if (!views.deviceStats[deviceType]) {
      views.deviceStats[deviceType] = 0;
    }
    views.deviceStats[deviceType] += 1;

    // Find existing visitor
    const thirtyMinutesAgo = new Date(timestamp - 30 * 60 * 1000);
    let visitor = views.visitors.find(v => (
      v.sessionId === sessionId || 
      (v.ip === ip && new Date(v.lastVisit) > thirtyMinutesAgo)
    ));

    const isNewVisitor = !visitor;
    if (isNewVisitor) {
      visitor = {
        sessionId,
        ip,
        userAgent,
        browser: browserInfo.name || 'Unknown',
        device: deviceType,
        country: geo?.country || 'Unknown',
        firstVisit: timestamp,
        lastVisit: timestamp,
        visits: []
      };
      views.visitors.push(visitor);
      views.uniqueVisitors += 1;
      dailyStats.visitors += 1;
    }

    // Add new visit with encoded path
    visitor.visits.push({
      path: currentPath, // Store original path in visits
      timestamp,
      duration: 0,
      isExit: true,
      scrollDepth: 0
    });

    visitor.lastVisit = timestamp;
    views.pageViews += 1;

    // Update page-specific stats using encoded path
    const pageStats = views.viewsByPage.get(encodedPath) || { 
      views: 0, 
      avgDuration: 0,
      bounceRate: 0,
      originalPath: currentPath // Store original path for reference
    };
    pageStats.views += 1;
    views.viewsByPage.set(encodedPath, pageStats);

    views = await Views.findOneAndUpdate(
      { _id: views._id },  // Specify the document ID
      { $set: { ...views } },  // The fields to update
      { new: true, upsert: false, runValidators: true }  // Options
    );
    next();
  } catch (error) {
    console.error('Error tracking page view:', error);
    next();
  }
};

// Helper function to decode paths when retrieving stats
const decodePaths = (pageStats) => {
  return Array.from(pageStats.entries()).map(([encodedPath, stats]) => ({
    path: stats.originalPath || decodeURIComponent(encodedPath),
    ...stats._doc || stats
  }));
};
const isBot = (userAgent) => {
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /googlebot/i, /bingbot/i, /yahoo/i,
    /baidu/i, /semrush/i, /ahref/i, /lighthouse/i, /chrome-lighthouse/i,
    /pingdom/i, /pagespeed/i
  ];
  return botPatterns.some(pattern => pattern.test(userAgent));
};
