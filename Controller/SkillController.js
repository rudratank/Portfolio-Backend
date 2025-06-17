import Skils from "../Models/Skillmodel.js";
import mongoose from "mongoose";

export const createSkill = async (req, res) => {
    try {
      const skill = new Skils(req.body);
      console.log(skill);
      
      await skill.save();
      res.status(201).json({
        success: true,
        message: "Skill added successfully",
        data: skill
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "A skill with this name already exists"
        });
      }
      res.status(400).json({
        success: false,
        message: "Error adding skill",
        error: error.message
      });
    }
  };
  
  // Get all skills
  export const getSkills = async (req, res) => {
    try {
      const { category } = req.query;
      const query = category ? { category } : {};
      
      const skills = await Skils.find(query).sort({ name: 1 });
      console.log(skills);
      
      
      // Return empty array if no skills found (this is not an error condition)
      res.status(200).json({
        success: true,
        count: skills.length,
        data: skills  // This will be an empty array if no skills exist
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching skills",
        error: error.message
      });
    }
  };
  
  // Get skill by ID
  export const getSkillById = async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid skill ID format"
        });
      }
  
      const skill = await Skils.findById(id);
      if (!skill) {
        return res.status(404).json({
          success: false,
          message: "Skill not found"
        });
      }
  
      res.status(200).json({
        success: true,
        data: skill
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching skill",
        error: error.message
      });
    }
  };
  
  // Update a skill
  export const updateSkill = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Ensure `id` exists and is valid
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid or missing Skill ID format",
        });
      }
  
      const skill = await Skils.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true, runValidators: true }
      );
  
      if (!skill) {
        return res.status(404).json({
          success: false,
          message: "Skill not found",
        });
      }
  
      res.status(200).json({
        success: true,
        message: "Skill updated successfully",
        data: skill,
      });
    } catch (error) {
      console.error("Error updating skill:", error); // Log the error in detail
      res.status(500).json({
        success: false,
        message: "Error updating skill",
        error: error.message,
      });
    }
  };
  
  
  // Delete a skill
  export const deleteSkill = async (req, res) => {
    try {
      const { id } = req.params;
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid skill ID format"
        });
      }
  
      const skill = await Skils.findByIdAndDelete(id);
      if (!skill) {
        return res.status(404).json({
          success: false,
          message: "Skill not found"
        });
      }
  
      res.status(200).json({
        success: true,
        message: "Skill deleted successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error deleting skill",
        error: error.message
      });
    }
  };