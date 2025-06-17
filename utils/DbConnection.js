import express from "express";
import mongoose from "mongoose";

const connection = (databaseurl)=>{
    mongoose.connect(databaseurl)
    .then(() => console.log("Database Connection Successful..."))
    .catch((err)=>console.log("Database Connection Error",err));
}

export default connection;