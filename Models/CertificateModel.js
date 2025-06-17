import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Certificate title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    platform: {
      type: String,
      required: [true, "Platform/Issuer name is required"],
      trim: true,
      minlength: [2, "Platform name must be at least 2 characters"],
      maxlength: [50, "Platform name cannot exceed 50 characters"],
    },
    date: {
      type: String,
      required: [true, "Issue date is required"],
      validate: {
        validator: function (v) {
          // Validate date format (YYYY-MM)
          return /^\d{4}-\d{2}$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid date format! Use YYYY-MM`,
      },
    },
    image: {
      type: String,
      required: [true, "Certificate image is required"],
      validate: {
        validator: function (v) {
          // Updated to accept both local and Cloudinary URLs
          return (
            /^\/uploads\/images\/.*\.(jpg|jpeg|png|webp)$/i.test(v) ||
            /^https:\/\/res\.cloudinary\.com\/.*/.test(v)
          );
        },
        message: (props) =>
          `${props.value} is not a valid image path or Cloudinary URL!`,
      },
    },
    image_public_id: {
      type: String,
      required: false, // Store Cloudinary public ID for deletion
    },
    credentialId: {
      type: String,
      trim: true,
    },
    credentialUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          // Skip validation if empty
          if (!v) return true;
          // Basic URL validation
          try {
            new URL(v);
            return true;
          } catch (err) {
            return false;
          }
        },
        message: (props) => `${props.value} is not a valid URL!`,
      },
    },
    expiryDate: {
      type: String,
      validate: {
        validator: function (v) {
          // Skip validation if empty
          if (!v) return true;
          // Validate date format (YYYY-MM)
          return /^\d{4}-\d{2}$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid date format! Use YYYY-MM`,
      },
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for formatted dates
certificateSchema.virtual("formattedDate").get(function () {
  if (!this.date) return "";
  const [year, month] = this.date.split("-");
  return new Date(year, month - 1).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
});

// Virtual for formatted expiry date
certificateSchema.virtual("formattedExpiryDate").get(function () {
  if (!this.expiryDate) return "";
  const [year, month] = this.expiryDate.split("-");
  return new Date(year, month - 1).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
});

// Pre-save middleware to ensure date formats
certificateSchema.pre("save", function (next) {
  // Ensure date is in YYYY-MM format
  if (this.date && !/^\d{4}-\d{2}$/.test(this.date)) {
    try {
      const date = new Date(this.date);
      this.date = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
    } catch (err) {
      next(new Error("Invalid date format"));
      return;
    }
  }

  // Same for expiry date if it exists
  if (this.expiryDate && !/^\d{4}-\d{2}$/.test(this.expiryDate)) {
    try {
      const date = new Date(this.expiryDate);
      this.expiryDate = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
    } catch (err) {
      next(new Error("Invalid expiry date format"));
      return;
    }
  }

  next();
});

// Index for efficient queries
certificateSchema.index({ date: -1 });
certificateSchema.index({ platform: 1 });
certificateSchema.index({ title: 1 });

const Certificate = mongoose.model("Certificate", certificateSchema);
export default Certificate;
