import Views from "../Models/ViewsModel.js";
import { isAdminPath } from '../Utils/PathUtils.js';
import UAParser from 'ua-parser-js';
import geoip from 'geoip-lite';

export const trackPageView = async (req, res, next) => {
  try {
    if (
      isAdminPath(req.path) || 
      req.path.startsWith('/api/') ||
      req.path.includes('.')
    ) {
      return next();
    }

    const userAgent = req.get('user-agent');
    if (!userAgent || isBot(userAgent)) {
      return next();
    }

    const sessionId = req.session?.id;
    if (!sessionId) {
      console.warn('No session ID found');
      return next();
    }

    // Parse user agent for browser info
    const parser = new UAParser(userAgent);
    const browserInfo = parser.getBrowser();
    const deviceInfo = parser.getDevice();
    
    // Get visitor's IP and location
    const ip = req.ip || req.connection.remoteAddress;
    console.log(ip);
    
    const geo = geoip.lookup(ip);
    
    // Clean the page path
    const page = req.path.split('?')[0].replace(/\/$/, '') || '/';
    const today = new Date().toISOString().split('T')[0];

    // Get or create Views document
    let views = await Views.findOne();
    if (!views) {
      views = new Views({
        pageViews: 0,
        uniqueVisitors: 0,
        bounceRate: 0,
        avgSessionDuration: 0,
        viewsByPage: new Map(),
        dailyStats: new Map(),
        deviceStats: {
          desktop: 0,
          mobile: 0,
          tablet: 0,
          other: 0
        },
        visitors: []
      });
    }

    // Find existing visitor
    let visitor = views.visitors.find(v => 
      v.sessionId === sessionId || 
      (v.ip === ip && Date.now() - new Date(v.lastVisit).getTime() < 30 * 60 * 1000)
    );

    // Create new visitor if not found
    if (!visitor) {
      visitor = {
        sessionId,
        ip,
        userAgent,
        browser: browserInfo.name,
        device: getDeviceType(deviceInfo.type),
        country: geo?.country || 'Unknown',
        firstVisit: new Date(),
        lastVisit: new Date(),
        visits: []
      };
      views.visitors.push(visitor);
      views.uniqueVisitors += 1;

      // Update device stats
      const deviceType = getDeviceType(deviceInfo.type);
      views.deviceStats[deviceType] += 1;
    }

    // Check for recent visits to this page
    const recentVisit = visitor.visits.find(visit => 
      visit.page === page && 
      Date.now() - new Date(visit.timestamp).getTime() < 30 * 60 * 1000
    );

    if (!recentVisit) {
      // Update page views
      views.pageViews += 1;
      
      // Update views by page
      const pageStats = views.viewsByPage.get(page) || {
        views: 0,
        avgDuration: 0,
        bounceRate: 0
      };
      pageStats.views += 1;
      views.viewsByPage.set(page, pageStats);

      // Update daily stats
      const dailyStats = views.dailyStats.get(today) || {
        views: 0,
        visitors: 0,
        bounceRate: 0,
        avgDuration: 0
      };
      dailyStats.views += 1;
      views.dailyStats.set(today, dailyStats);

      // Record visit
      visitor.visits.push({
        page,
        timestamp: new Date(),
        duration: 0,
        isExit: false,
        scrollDepth: 0
      });
    }

    visitor.lastVisit = new Date();

    // Cleanup old data (keep last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    views.visitors = views.visitors.filter(v => 
      new Date(v.lastVisit) > thirtyDaysAgo
    );

    await views.save();
    next();
  } catch (error) {
    console.error('Error tracking page view:', error);
    next();
  }
};

// Helper function to determine device type
const getDeviceType = (type) => {
  switch (type) {
    case 'mobile':
      return 'mobile';
    case 'tablet':
      return 'tablet';
    case 'desktop':
      return 'desktop';
    default:
      return 'other';
  }
};

// Bot detection
const isBot = (userAgent) => {
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /googlebot/i, /bingbot/i, /yahoo/i,
    /baidu/i, /semrush/i, /ahref/i, /lighthouse/i, /chrome-lighthouse/i,
    /pingdom/i, /pagespeed/i
  ];
  return botPatterns.some(pattern => pattern.test(userAgent));
};