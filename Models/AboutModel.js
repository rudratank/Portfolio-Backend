import mongoose from "mongoose";

const aboutSchema = new mongoose.Schema({
    image: {
      type: String,  // Store the image URL after upload
      required: false
    },
    resume: {
      type: String,  // Store the resume URL after upload
      required: false
    },
    description: {
      type: String,
      required: [true, 'Description is required']
    },
    projectsCompleted: {
      type: Number,
      required: [true, 'Number of completed projects is required']
    },
    experience: {
      type: Number,
      required: [true, 'Years of experience is required']
    },
    support: {
      type: String,
      required: [true, 'Support hours are required']
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  });

const About = mongoose.model('About', aboutSchema);
export default About;