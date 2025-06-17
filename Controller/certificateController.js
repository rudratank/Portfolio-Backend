import {
  removeCloudinaryFile,
  extractPublicId,
} from "../Middleware/uploadMiddleware.js";
import Certificate from "../Models/CertificateModel.js";
import { invalidateCache } from "../Middleware/catchMiddleware.js";

// Get all certificates
export const getCertificate = async (req, res) => {
  try {
    const certificates = await Certificate.find().sort({ date: -1 });

    res.status(200).json({
      success: true,
      message: "Certificates fetched successfully",
      data: certificates,
    });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching certificates",
      error: error.message,
    });
  }
};

// Add certificate
export const addCertificate = async (req, res) => {
  try {
    const {
      title,
      platform,
      date,
      credentialId,
      credentialUrl,
      expiryDate,
      skills,
    } = req.body;

    if (!title || !platform || !date || !req.body.image) {
      return res.status(400).json({
        success: false,
        message: "Title, platform, date, and image are required",
      });
    }

    const certificateData = {
      title,
      platform,
      date,
      image: req.body.image,
    };

    // Add optional fields if provided
    if (credentialId) certificateData.credentialId = credentialId;
    if (credentialUrl) certificateData.credentialUrl = credentialUrl;
    if (expiryDate) certificateData.expiryDate = expiryDate;
    if (skills) {
      if (typeof skills === "string") {
        certificateData.skills = skills
          .split(",")
          .map((skill) => skill.trim())
          .filter((skill) => skill);
      } else if (Array.isArray(skills)) {
        certificateData.skills = skills.filter(
          (skill) => skill && skill.trim()
        );
      }
    }

    if (req.body.image_public_id) {
      certificateData.image_public_id = req.body.image_public_id;
    }

    const certificate = await Certificate.create(certificateData);

    // Invalidate related cache entries
    invalidateCache("/api/user"); // Clear user-facing certificate cache
    invalidateCache("/api/certificate"); // Clear admin certificate cache

    res.status(201).json({
      success: true,
      message: "Certificate added successfully",
      data: certificate,
    });
  } catch (error) {
    console.error("Error adding certificate:", error);

    if (req.body.image_public_id) {
      try {
        await removeCloudinaryFile(req.body.image_public_id);
      } catch (cleanupError) {
        console.error("Error cleaning up uploaded image:", cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: "Error adding certificate",
      error: error.message,
    });
  }
};

// Update certificate
export const updateCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      platform,
      date,
      credentialId,
      credentialUrl,
      expiryDate,
      skills,
    } = req.body;

    const existingCertificate = await Certificate.findById(id);
    if (!existingCertificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    const updateData = {
      title: title || existingCertificate.title,
      platform: platform || existingCertificate.platform,
      date: date || existingCertificate.date,
    };

    if (credentialId !== undefined) updateData.credentialId = credentialId;
    if (credentialUrl !== undefined) updateData.credentialUrl = credentialUrl;
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate;

    if (skills !== undefined) {
      if (typeof skills === "string") {
        updateData.skills = skills
          .split(",")
          .map((skill) => skill.trim())
          .filter((skill) => skill);
      } else if (Array.isArray(skills)) {
        updateData.skills = skills.filter((skill) => skill && skill.trim());
      }
    }

    // Handle image update if new image is uploaded
    if (req.body.image) {
      if (existingCertificate.image_public_id) {
        try {
          await removeCloudinaryFile(existingCertificate.image_public_id);
        } catch (error) {
          console.warn("Could not remove old image from Cloudinary:", error);
        }
      } else if (existingCertificate.image) {
        const publicId = extractPublicId(existingCertificate.image);
        if (publicId) {
          try {
            await removeCloudinaryFile(publicId);
          } catch (error) {
            console.warn("Could not remove old image from Cloudinary:", error);
          }
        }
      }

      updateData.image = req.body.image;
      if (req.body.image_public_id) {
        updateData.image_public_id = req.body.image_public_id;
      }
    }

    const updatedCertificate = await Certificate.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Invalidate related cache entries
    invalidateCache("/api/user"); // Clear user-facing certificate cache
    invalidateCache("/api/certificate"); // Clear admin certificate cache

    res.status(200).json({
      success: true,
      message: "Certificate updated successfully",
      data: updatedCertificate,
    });
  } catch (error) {
    console.error("Error updating certificate:", error);
    res.status(500).json({
      success: false,
      message: "Error updating certificate",
      error: error.message,
    });
  }
};

// Delete certificate
export const deleteCertificate = async (req, res) => {
  try {
    const { id } = req.params;

    const certificate = await Certificate.findById(id);
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    if (certificate.image_public_id) {
      try {
        await removeCloudinaryFile(certificate.image_public_id);
      } catch (error) {
        console.warn("Could not remove image from Cloudinary:", error);
      }
    } else if (certificate.image) {
      const publicId = extractPublicId(certificate.image);
      if (publicId) {
        try {
          await removeCloudinaryFile(publicId);
        } catch (error) {
          console.warn("Could not remove image from Cloudinary:", error);
        }
      }
    }

    await Certificate.findByIdAndDelete(id);

    // Invalidate related cache entries
    invalidateCache("/api/user"); // Clear user-facing certificate cache
    invalidateCache("/api/certificate"); // Clear admin certificate cache

    res.status(200).json({
      success: true,
      message: "Certificate deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting certificate:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting certificate",
      error: error.message,
    });
  }
};
