import mongoose from "mongoose";

const educationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a degree title'],
        trim: true,
      },
      institution: {
        type: String,
        required: [true, 'Please provide an institution name'],
        trim: true,
      },
      period: {
        type: String,
        required: [true, 'Please provide the study period'],
        trim: true,
      },
      description: {
        type: String,
        required: [true, 'Please provide a description'],
        trim: true,
      },
},{ timestamps: true });

const Education = mongoose.model('Education', educationSchema);

export default Education;