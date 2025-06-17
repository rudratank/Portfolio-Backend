import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    features: {
        type: [String],
        required: true
    },
    techStack: {
        type: [String],
        required: true
    },
    image: {
        type: String,
        default: '/api/placeholder/400/300'
    },
    liveLink: {
        type: String,
        trim: true
    },
    codeLink: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

const Project = mongoose.model('Project', projectSchema);

export default Project;