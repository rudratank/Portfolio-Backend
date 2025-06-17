// In your HomeModels.js
import mongoose from "mongoose";

const HomeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: '/api/placeholder/400/400'
    },
    socialLinks: {
      facebook: {
        type: String,
        validate: {
          validator: function (url) {
            return !url || /^https?:\/\/(www\.)?facebook\.com\/[A-Za-z0-9_.]+/.test(url);
          },
          message: "Invalid Facebook URL",
        },
      },
      twitter: {
        type: String,
        validate: {
          validator: function (url) {
            // Accept both twitter.com and x.com domains
            return !url || /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[A-Za-z0-9_]+/.test(url);
          },
          message: "Invalid Twitter/X URL",
        },
      },
      linkedin: {
        type: String,
        validate: {
          validator: function (url) {
            return !url || /^https?:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+/.test(url);
          },
          message: "Invalid LinkedIn URL",
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

const Home = mongoose.model("Home", HomeSchema);
export default Home;

