import { removeCloudinaryFile } from "../Middleware/uploadMiddleware.js";
import Home from "../Models/HomeModel.js";
import { AppError, catchAsync } from "../utils/errorHandler.js";
import Joi from "joi";
import sanitizeHtml from "sanitize-html";

// Input validation schema
const homeSchema = Joi.object({
  name: Joi.string().required().trim().max(100),
  title: Joi.string().required().trim().max(200),
  description: Joi.string().required().trim().max(1000),
  image: Joi.string().allow(""),
  facebook: Joi.string().uri().allow("").max(500),
  twitter: Joi.string().uri().allow("").max(500),
  linkedin: Joi.string().uri().allow("").max(500),
});

const sanitizeInput = (data) => {
  const options = {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: "recursiveEscape",
  };

  return {
    name: sanitizeHtml(data.name, options),
    title: sanitizeHtml(data.title, options),
    description: sanitizeHtml(data.description, options),
    image: data.image,
    facebook: sanitizeHtml(data.facebook, options),
    twitter: sanitizeHtml(data.twitter, options),
    linkedin: sanitizeHtml(data.linkedin, options),
  };
};

// New separate handler for image uploads
export const uploadImage = catchAsync(async (req, res) => {
  if (!req.files?.image) {
    throw new AppError("No image file provided", 400);
  }

  const currentData = await Home.findOne();
  const newImagePath = req.body.image; // Set by uploadMiddleware

  if (currentData?.image) {
    await removeCloudinaryFile(currentData.image);
  }

  if (!currentData) {
    const newHome = new Home({ image: newImagePath });
    await newHome.save();
  } else {
    currentData.image = newImagePath;
    await currentData.save();
  }

  return res.status(200).json({
    success: true,
    message: "Image uploaded successfully",
    filepath: newImagePath,
  });
});

export const updateHome = catchAsync(async (req, res) => {
  const { error } = homeSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const sanitizedData = sanitizeInput(req.body);
  let updatedData = await Home.findOne();

  // Only handle image cleanup if this is a full update (not an image upload)
  // and if there's actually a change in the image path
  if (
    !req.files &&
    updatedData &&
    sanitizedData.image &&
    updatedData.image !== sanitizedData.image
  ) {
    await removeCloudinaryFile(updatedData.image);
  }

  if (!updatedData) {
    updatedData = new Home({
      name: sanitizedData.name,
      title: sanitizedData.title,
      description: sanitizedData.description,
      image: sanitizedData.image,
      socialLinks: {
        facebook: sanitizedData.facebook,
        twitter: sanitizedData.twitter,
        linkedin: sanitizedData.linkedin,
      },
    });
  } else {
    updatedData.name = sanitizedData.name;
    updatedData.title = sanitizedData.title;
    updatedData.description = sanitizedData.description;
    if (sanitizedData.image) {
      updatedData.image = sanitizedData.image;
    }
    updatedData.socialLinks = {
      facebook: sanitizedData.facebook,
      twitter: sanitizedData.twitter,
      linkedin: sanitizedData.linkedin,
    };
  }

  await updatedData.save();

  res.set("Cache-Control", "public, max-age=300");

  return res.status(200).json({
    status: "success",
    message: updatedData ? "Update successful!" : "Data added successfully!",
    data: updatedData,
  });
});

export const getHome = catchAsync(async (req, res) => {
  const data = await Home.findOne().select("-__v");

  if (!data) {
    throw new AppError("No home data found", 404);
  }

  res.set("Cache-Control", "public, max-age=300");

  return res.status(200).json({
    status: "success",
    data,
  });
});
