import Views from "../Models/ViewsModel.js";
import Project from "../Models/ProjectModels.js";
import Message from "../Models/MessageModel.js";
import Skils from "../Models/Skillmodel.js";



const generateViewsData = async (stats) => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  return last7Days.map(date => ({
    date,
    views: stats?.dailyStats?.get(date)?.views || 0,
    visitors: stats?.dailyStats?.get(date)?.visitors || 0
  }));
};

const generateDeviceData = (stats) => {
  return [
    { name: 'Desktop', value: stats.deviceStats.desktop || 0 },
    { name: 'Mobile', value: stats.deviceStats.mobile || 0 },
    { name: 'Tablet', value: stats.deviceStats.tablet || 0 },
    { name: 'Other', value: stats.deviceStats.other || 0 }
  ];
};

const generatePagePerformance = (stats) => {
  const pages = Array.from(stats.viewsByPage.entries()).map(([page, data]) => ({
    page,
    views: data.views || 0,
    avgDuration: data.avgDuration || 0,
    bounceRate: data.bounceRate || 0
  }));

  return pages.sort((a, b) => b.views - a.views);
};

// backend/Controller/ViewsController.js
export const getDashboardStats = async (req, res) => {
  try {
    const [views, projectCount, messageCount, skillCount, recentMessages] = await Promise.all([
      Views.findOne(),
      Project.countDocuments(),
      Message.countDocuments(),
      Skils.countDocuments(),
      Message.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name subject createdAt')
    ]);

    const viewsData = await generateViewsData(views);
    const deviceData = generateDeviceData(views);
    const pagePerformance = generatePagePerformance(views);

    res.json({
      success: true,
      data: {
        totalViews: views?.pageViews || 0,
        uniqueVisitors: views?.uniqueVisitors || 0,
        bounceRate: views?.bounceRate || 0,
        avgSessionDuration: views?.avgSessionDuration || 0,
        projectCount,
        messageCount,
        skillCount,
        recentMessages: recentMessages.map(msg => ({
          name: msg.name,
          subject: msg.subject,
          createdAt: msg.createdAt
        })),
        viewsData,
        deviceData,
        pagePerformance
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
};
// Controllers/ViewsController.js



// Helper function to calculate date range
// Controllers/ViewsController.js

// Helper function to calculate date range
const getDateRange = (days) => {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

export const getPageViews = async (req, res) => {
  try {
    const { range = '7d' } = req.query;
    const views = await Views.findOne();
    
    const days = range === '30d' ? 30 : range === '14d' ? 14 : 7;
    const dateRange = getDateRange(days);
    
    const pageViewData = dateRange.map(date => ({
      date,
      views: views?.dailyStats?.get(date)?.views || 0
    }));

    // Get page-specific stats with decoded paths
    const pageStats = views ? decodePaths(views.viewsByPage) : [];

    res.json({
      success: true,
      data: {
        timeSeriesData: pageViewData,
        pageStats: pageStats
      }
    });
  } catch (error) {
    console.error('Error fetching page views:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching page views',
      error: error.message
    });
  }
};

export const getVisitorStats = async (req, res) => {
  try {
    const views = await Views.findOne();

    if (!views) {
      return res.json({
        success: true,
        data: {
          total: 0,
          returning: 0,
          new: 0,
          locations: [],
          browsers: [],
          devices: []
        }
      });
    }

    // Get unique visitors in the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeVisitors = views.visitors.filter(v => 
      new Date(v.lastVisit) >= thirtyDaysAgo
    );

    // Count returning visitors (more than one visit)
    const returningCount = activeVisitors.filter(v => 
      v.visits.length > 1
    ).length;

    // Aggregate visitor data
    const stats = activeVisitors.reduce((acc, visitor) => {
      // Count browsers
      if (visitor.browser) {
        acc.browsers[visitor.browser] = (acc.browsers[visitor.browser] || 0) + 1;
      }
      // Count locations
      if (visitor.country) {
        acc.locations[visitor.country] = (acc.locations[visitor.country] || 0) + 1;
      }
      return acc;
    }, { browsers: {}, locations: {} });

    const visitorStats = {
      total: activeVisitors.length,
      returning: returningCount,
      new: activeVisitors.length - returningCount,
      locations: Object.entries(stats.locations)
        .map(([country, visitors]) => ({ country, visitors }))
        .sort((a, b) => b.visitors - a.visitors),
      browsers: Object.entries(stats.browsers)
        .map(([browser, users]) => ({ browser, users }))
        .sort((a, b) => b.users - a.users),
      devices: Object.entries(views.deviceStats)
        .map(([device, users]) => ({ device, users }))
        .filter(item => item.users > 0)
        .sort((a, b) => b.users - a.users)
    };

    res.json({
      success: true,
      data: visitorStats
    });
  } catch (error) {
    console.error('Error fetching visitor stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching visitor statistics',
      error: error.message
    });
  }
};