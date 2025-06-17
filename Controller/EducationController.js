import Education from "../Models/EducationModel.js";
import mongoose from 'mongoose';
export const getAllEducation = async (req, res, next) => {
  try {
      const educations = await Education.find().sort({ createdAt: -1 });
      res.status(200).json({
          success: true,
          data: educations
      });
  } catch (error) {
      next(createError(500, "Error fetching education data"));
  }
};

// Create new education entry
export const createEducation = async (req, res, next) => {
  try {
      const { title, institution, period, description } = req.body;
      
      if (!title || !institution || !period || !description) {
          return next(createError(400, "All fields are required"));
      }

      const newEducation = await Education.create({
          title,
          institution,
          period,
          description
      });

      res.status(201).json({
          success: true,
          message: "Education created successfully",
          data: newEducation
      });
  } catch (error) {
      next(createError(500, "Error creating education entry"));
  }
};

// Update education entry
export const updateEducation = async (req, res, next) => {
  try {
      const { id } = req.params;
      const { title, institution, period, description } = req.body;

      if (!title && !institution && !period && !description) {
          return next(createError(400, "At least one field is required for update"));
      }

      const updatedEducation = await Education.findByIdAndUpdate(
          id,
          {
              $set: {
                  title,
                  institution,
                  period,
                  description
              }
          },
          { new: true }
      );

      if (!updatedEducation) {
          return next(createError(404, "Education entry not found"));
      }

      res.status(200).json({
          success: true,
          message: "Education updated successfully",
          data: updatedEducation
      });
  } catch (error) {
      next(createError(500, "Error updating education entry"));
  }
};

// Delete education entry
export const deleteEducation = async (req, res, next) => {
  try {
      const { id } = req.params;

      const deletedEducation = await Education.findByIdAndDelete(id);

      if (!deletedEducation) {
          return next(createError(404, "Education entry not found"));
      }

      res.status(200).json({
          success: true,
          message: "Education deleted successfully"
      });
  } catch (error) {
      next(createError(500, "Error deleting education entry"));
  }
};

