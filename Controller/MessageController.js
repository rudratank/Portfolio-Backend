import Message from "../Models/MessageModel.js";

export const createMessage = async (req, res) => {
  try {
    // Now destructure 'message' instead of 'project' since frontend sends 'message'
    const { name, email, message, subject } = req.body;

    const newMessage = await Message.create({
      name,
      email,
      subject: subject || "Project Inquiry", // Default subject
      message, // Direct mapping - no need to map from 'project'
      status: "unread",
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

export const getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
};

export const updateMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const message = await Message.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update message status",
      error: error.message,
    });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
      error: error.message,
    });
  }
};
