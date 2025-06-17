import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import About from "../Models/AboutModel.js";
import {
  removeCloudinaryFile,
  extractPublicId,
} from "../Middleware/uploadMiddleware.js";

// Get current directory when using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Controller for fetching the 'About' section
export const getAbout = async (req, res) => {
  try {
    const about = await About.findOne().sort({ updatedAt: -1 });
    if (!about) {
      return res.status(404).json({
        success: false,
        message: "About section not found",
      });
    }
    res.status(200).json({
      success: true,
      data: about,
    });
  } catch (error) {
    console.error("Get About Error:", error);
    res.status(500).json({
      success: false,
      message:
        error.message || "Internal server error while fetching about section",
    });
  }
};

// Controller for updating or creating the 'About' section
export const updateAbout = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);

    let aboutData = { ...req.body };

    // Convert string numbers to actual numbers
    if (aboutData.projectsCompleted) {
      aboutData.projectsCompleted = Number(aboutData.projectsCompleted);
    }
    if (aboutData.experience) {
      aboutData.experience = Number(aboutData.experience);
    }

    // Find existing about section
    const existingAbout = await About.findOne();
    console.log("Existing about:", existingAbout);

    // Handle file uploads from Cloudinary middleware
    if (req.body.image) {
      aboutData.image = req.body.image;
    }
    if (req.body.resume) {
      aboutData.resume = req.body.resume;
    }

    let about;
    if (!existingAbout) {
      // Create new about section
      about = new About(aboutData);
      await about.save();
      console.log("Created new about section:", about);
    } else {
      // Remove old Cloudinary files if new ones are uploaded
      if (req.body.image && existingAbout.image) {
        try {
          const publicId = extractPublicId(existingAbout.image);
          if (publicId) {
            await removeCloudinaryFile(publicId);
            console.log("Removed old image from Cloudinary");
          }
        } catch (error) {
          console.error("Error removing old image:", error);
          // Don't fail the entire operation if file removal fails
        }
      }

      if (req.body.resume && existingAbout.resume) {
        try {
          const publicId = extractPublicId(existingAbout.resume);
          if (publicId) {
            await removeCloudinaryFile(publicId);
            console.log("Removed old resume from Cloudinary");
          }
        } catch (error) {
          console.error("Error removing old resume:", error);
          // Don't fail the entire operation if file removal fails
        }
      }

      // Update existing about section
      about = await About.findByIdAndUpdate(
        existingAbout._id,
        {
          ...aboutData,
          updatedAt: new Date(),
        },
        {
          new: true,
          runValidators: true,
        }
      );
      console.log("Updated about section:", about);
    }

    if (!about) {
      return res.status(404).json({
        success: false,
        message: "Failed to save about section",
      });
    }

    res.status(200).json({
      success: true,
      data: about,
      message: existingAbout ? "Updated successfully" : "Created successfully",
    });
  } catch (error) {
    console.error("Update About Error:", error);
    console.error("Error stack:", error.stack);

    // Handle specific error types
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message:
          "Validation error: " +
          Object.values(error.errors)
            .map((e) => e.message)
            .join(", "),
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid data format",
      });
    }

    res.status(500).json({
      success: false,
      message:
        error.message || "Internal server error while updating about section",
      // Only include stack trace in development
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
};
