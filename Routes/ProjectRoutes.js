import express from "express";
import { verifyToken } from "../Middleware/Authatication.js";
import { addProject,deleteProject,getProject, updateProject } from "../Controller/ProjectController.js";
import { uploadMiddleware } from "../Middleware/uploadMiddleware.js";



const router = express.Router();

router.get("/get-project", verifyToken, getProject);
router.post("/addProject", verifyToken, uploadMiddleware, addProject);
router.put("/update-project/:id", verifyToken, uploadMiddleware, updateProject);
router.delete("/delete-project/:id", verifyToken, deleteProject);


export default router;
