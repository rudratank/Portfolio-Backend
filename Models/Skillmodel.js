import mongoose from "mongoose";

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Skill name is required"],
    trim: true,
    unique: true,
  },
  level: {
    type: String,
    enum: {
      values: ["Basic", "Intermediate", "Advanced"],
      message: "{VALUE} is not a valid skill level",
    },
    required: [true, "Skill level is required"],
  },
  icon: {
    type: String,
    required: [true, "Icon is required"],
    trim: true,
  },
  iconColor: {
    type: String,
    required: [true, "Icon color is required"],
    trim: true,
  },
  category: {
    type: String,
    enum: {
      values: ["frontend", "backend"],
      message: "{VALUE} is not a valid category",
    },
    required: [true, "Skill category is required"],
  },
}, {
  timestamps: true,
  versionKey: false
});

skillSchema.index({ name: 1 });
skillSchema.index({ category: 1 });

const Skils = mongoose.model("Skills", skillSchema);
export default Skils;
