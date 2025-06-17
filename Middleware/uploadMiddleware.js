import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Validate Cloudinary configuration
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('Missing Cloudinary configuration. Please check your environment variables.');
}

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for images and resumes
const fileFilter = (req, file, cb) => {
  console.log('File filter - Field:', file.fieldname, 'Type:', file.mimetype);
  
  if (file.fieldname === "image") {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG and WebP images are allowed"), false);
    }
    cb(null, true);
  } else if (file.fieldname === "resume") {
    const allowedTypes = ["application/pdf"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only PDF files are allowed for resume"), false);
    }
    cb(null, true);
  } else {
    cb(new Error(`Unexpected field: ${file.fieldname}`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 2, // Allow up to 2 files (image and resume)
  },
  fileFilter: fileFilter,
});

// Upload file to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    console.log('Uploading to Cloudinary with options:', options);
    
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: options.folder || "certificates",
        format: options.format,
        quality: "auto:good",
        fetch_format: "auto",
        ...options,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('Cloudinary upload success:', result.secure_url);
          resolve(result);
        }
      }
    );

    const stream = Readable.from(buffer);
    stream.pipe(uploadStream);
  });
};

// Remove file from Cloudinary
export const removeCloudinaryFile = async (publicId) => {
  if (!publicId) return;

  try {
    console.log('Removing file from Cloudinary:', publicId);
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`Successfully removed file from Cloudinary: ${publicId}`, result);
    return result;
  } catch (error) {
    console.error("Error removing file from Cloudinary:", error);
    throw error;
  }
};

// Extract public ID from Cloudinary URL
export const extractPublicId = (cloudinaryUrl) => {
  if (!cloudinaryUrl) return null;

  try {
    // Handle different Cloudinary URL formats
    const urlParts = cloudinaryUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) return null;
    
    // Get everything after the version (if present) or after upload
    let startIndex = uploadIndex + 1;
    if (urlParts[startIndex] && urlParts[startIndex].startsWith('v')) {
      startIndex += 1; // Skip version
    }
    
    // Join the remaining parts and remove file extension
    const pathWithExtension = urlParts.slice(startIndex).join('/');
    const publicId = pathWithExtension.replace(/\.[^/.]+$/, ""); // Remove extension
    
    console.log('Extracted public ID:', publicId, 'from URL:', cloudinaryUrl);
    return publicId;
  } catch (error) {
    console.error('Error extracting public ID from URL:', cloudinaryUrl, error);
    return null;
  }
};

// Main upload middleware
export const uploadMiddleware = (req, res, next) => {
  console.log('Upload middleware called');
  
  const uploadFields = upload.fields([
    { name: "image", maxCount: 1 },
    { name: "resume", maxCount: 1 },
  ]);

  uploadFields(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`,
      });
    } else if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    try {
      console.log('Files received:', req.files);
      
      if (req.files) {
        for (const [fieldName, files] of Object.entries(req.files)) {
          const file = files[0];
          console.log(`Processing ${fieldName}:`, file.originalname);

          let uploadOptions = {};

          if (fieldName === "image") {
            uploadOptions = {
              folder: "certificates/images",
              format: "webp",
              transformation: [
                { width: 800, height: 600, crop: "limit" },
                { quality: "auto:good" },
              ],
            };
          } else if (fieldName === "resume") {
            uploadOptions = {
              folder: "certificates/resumes",
              resource_type: "raw", // Important for non-image files
            };
          }

          const result = await uploadToCloudinary(file.buffer, uploadOptions);

          // Store both URL and public_id for future reference
          req.body[fieldName] = result.secure_url;
          req.body[`${fieldName}_public_id`] = result.public_id;
          
          console.log(`${fieldName} uploaded successfully:`, result.secure_url);
        }
      }
      
      console.log('Final request body:', req.body);
      next();
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      return res.status(500).json({
        success: false,
        message: "Error uploading files to cloud storage",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
};