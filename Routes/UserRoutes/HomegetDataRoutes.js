import express from "express";
import {
  getAllProjects,
  getProjectById,
  getResume,
  getUserAboutData,
  getUserEducation,
  getuserHomeData,
  getUserSkills,
} from "../../Controller/UserController/UserHomeController.js";

const router = express.Router();

// Add CORS middleware to all user routes
router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://rudracodes.netlify.app");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

router.get("/userhome-data", getuserHomeData);
router.get("/userabout-data", getUserAboutData);
router.get("/userskills-data", getUserSkills);
router.get("/usereducation-data", getUserEducation);
router.get("/projects", getAllProjects);
router.get("/projects/:id", getProjectById);
router.get("/resume", getResume);

export default router;
