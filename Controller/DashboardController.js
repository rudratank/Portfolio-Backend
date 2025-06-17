import Message from "../Models/MessageModel.js";
import Project from "../Models/ProjectModels.js";
import Skils from "../Models/Skillmodel.js";
import Views from "../Models/ViewsModel.js";

export const getDashboardStats = async (req, res) => {
  try {
    // Get counts from different collections
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

    // Generate last 7 days dates
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    // Get views data for each day from dailyStats
    const viewsData = last7Days.map(date => ({
      date,
      views: (views?.dailyStats?.get(date)?.views || 0)
    }));

    // Calculate total views from dailyStats
    const totalViews = Array.from(views?.dailyStats?.values() || [])
      .reduce((sum, day) => sum + (day.views || 0), 0);

    // Prepare the response
    const response = {
      totalViews,
      projectCount,
      messageCount,
      skillCount,
      recentMessages: recentMessages.map(msg => ({
        name: msg.name,
        subject: msg.subject,
        createdAt: msg.createdAt
      })),
      viewsData
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      message: 'Error fetching dashboard statistics',
      error: error.message 
    });
  }
};