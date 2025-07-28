import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import userModel from "../model/user"; // Adjust the path to your user model
import { dbConnect } from "../db";

dotenv.config();

const adminData = {
  name: "Admin User",
  email: "admin@example.com",
  password: "Admin@123", // This will be hashed
  role: "admin",
}; 

export const seedAdmin = async () => {
  try {
    // Connect to the database using dbConnect
    await dbConnect();
    console.log("Database connected");

    // Check if admin already exists
    const existingAdmin = await userModel.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }else {
      console.log("Admin user does not exist");
          // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);

    // Create new admin user
    const admin = new userModel({
      ...adminData,
      password: hashedPassword,
    });

    // Save the admin user
    await admin.save();
    console.log("Admin user created successfully");

    // Close the connection
    await mongoose.connection.close();
    console.log("Database connection closed");

    }

  } catch (error: any) {
    console.error("Error seeding admin data:", error.message);
    console.error(error);
  }
};

// Execute the seed function
seedAdmin();