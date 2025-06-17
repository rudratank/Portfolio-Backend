import express from 'express';
import {getAllProjects, getProjectById, getResume, getUserAboutData, getUserEducation, getuserHomeData, getUserSkills} from '../../Controller/UserController/UserHomeController.js'
const router = express.Router();

router.get('/userhome-data',getuserHomeData);
router.get('/userabout-data', getUserAboutData);
router.get('/userskills-data', getUserSkills);
router.get('/usereducation-data', getUserEducation);
router.get('/projects', getAllProjects);
router.get('/projects/:id', getProjectById);
router.get('/resume',getResume)

export default router;