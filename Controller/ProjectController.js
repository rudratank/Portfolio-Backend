import Project from '../Models/ProjectModels.js';
import mongoose from 'mongoose';
import path from 'path';
import { promises as fs } from 'fs';
import { uploadMiddleware } from '../Middleware/uploadMiddleware.js';

export const addProject = async (req, res) => {
    try {
        const { title, category, description } = req.body;
        let features = [];
        let techStack = [];

        try {
            features = JSON.parse(req.body.features || '[]');
            techStack = JSON.parse(req.body.techStack || '[]');
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid features or techStack format'
            });
        }

        // Get the image path from the middleware
        const imagePath = req.body.image || '/api/placeholder/400/300';

        if (!title || !category || !description || !features.length || !techStack.length) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided'
            });
        }

        const newProject = new Project({
            title,
            category,
            description,
            features,
            techStack,
            image: imagePath,
            liveLink: req.body.liveLink || '',
            codeLink: req.body.codeLink || ''
        });

        await newProject.save();

        return res.status(201).json({
            success: true,
            message: 'Project added successfully',
            project: newProject
        });
    } catch (error) {
        console.error('Error adding project:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Server error while adding project',
        });
    }
};

export const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID format"
            });
        }

        const updateData = { ...req.body };
        
        // Parse features and techStack arrays
        try {
            if (updateData.features) {
                updateData.features = JSON.parse(updateData.features);
            }
            
            if (updateData.techStack) {
                updateData.techStack = JSON.parse(updateData.techStack);
            }
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: `Invalid data format: ${error.message}`
            });
        }

        // Update image only if new image is uploaded
        if (req.body.image && req.body.image !== '/api/placeholder/400/300') {
            // Delete old image if exists
            const oldProject = await Project.findById(id);
            if (oldProject?.image && oldProject.image !== '/api/placeholder/400/300') {
                try {
                    const oldImagePath = path.join(process.cwd(), 'public', oldProject.image);
                    await fs.unlink(oldImagePath);
                } catch (error) {
                    console.warn('Could not delete old image:', error);
                }
            }
            updateData.image = req.body.image;
        }

        const updatedProject = await Project.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedProject) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Project updated successfully",
            data: updatedProject
        });
    } catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({
            success: false,
            message: "Error updating project",
            error: error.message
        });
    }
};

export const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID format"
            });
        }

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        // Delete image file if it exists
        if (project.image && project.image !== '/api/placeholder/400/300') {
            try {
                const imagePath = path.join(process.cwd(), 'public', project.image);
                await fs.unlink(imagePath);
            } catch (error) {
                console.warn('Could not delete project image:', error);
            }
        }

        await Project.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Project deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting project",
            error: error.message
        });
    }
};

export const getProject = async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            data: projects
        });
    } catch (error) {
        console.error('Get Projects Error:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || "Internal server error while fetching projects"
        });
    }
};