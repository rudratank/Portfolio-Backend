import express from "express";
import {
  createSkill,
  getSkills,
  getSkillById,
  updateSkill,
  deleteSkill,
} from '../Controller/SkillController.js'
import { verifyToken } from "../Middleware/Authatication.js";


const router = express.Router();

// Base route is assumed to be /api/skills
router.get("/",verifyToken, getSkills);
router.post("/",verifyToken, createSkill);
router.get("/:id",verifyToken, getSkillById);
router.put("/:id",verifyToken, updateSkill);
router.delete("/:id",verifyToken, deleteSkill);

export default router;