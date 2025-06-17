import mongoose from "mongoose";

const connection = async (databaseurl) => {
  try {
    await mongoose.connect(databaseurl);
    console.log("Database Connection Successful...");
  } catch (err) {
    console.log("Database Connection Error", err);
    throw err;
  }
};

export default connection;
