import { RequestHandler } from "express";
import userModel from "../model/user";
import { hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import { generatePassword } from "../utils/password-generator";
import { sendCreateUserEmail } from "../utils/email";
import cloudinary from "../cloud";
 
export const login: RequestHandler = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userExist = await userModel.findOne({ email });
    if (!userExist) return res.status(404).json({ message: "User not found" });

    const passwordMatch = await compare(password, userExist.password);
    if (!passwordMatch)
      return res.status(401).json({ message: "Invalid password" });

    // Update last login time
    userExist.lastLogin = new Date();
    await userExist.save();   

    const payload = { id: userExist._id, role: userExist.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET as string);

    const user = {name: userExist.name, email: userExist.email, role: userExist.role, status: userExist.status, lastLogin: userExist.lastLogin}
    res.status(200).json({ message: "user login successful", token, user });
  } catch (error) {
    return res.status(500).json({message: "Unable to login user", error})       
  }
};


export const createUser:RequestHandler = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const hashedPassword = await hash(password, 10);
    const user = await userModel.create({ name, email, password: hashedPassword, role });
    res.status(201).json({ message: "user created successfully", user: {id: user._id, email: user.email} });
  } catch (error) {   
    return res.status(500).json({message: "Unable to create user", error})       
  }
}

 export const addNewUser: RequestHandler = async (req, res) => {

  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized: Only admins can add users' });
  }

  const { name, email, role } = req.body;
  const avatar = req.files?.avatar as any;

  try {
    // Validate required fields 
    if (!email || !role) {
      return res.status(400).json({ message: 'Email and role are required' });
    }

    // Validate role
    if (!['manager', 'staff'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be manager or staff' });
    }

    // Validate avatar if provided 
    let avatarUrl: string | undefined;
    if (avatar && !Array.isArray(avatar)) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(avatar.mimetype)) {
        return res.status(400).json({ message: 'Invalid image format. Only JPEG, PNG, or GIF allowed' });
      }

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(avatar.filepath, {
        folder: 'users',
        resource_type: 'image',
      });
      avatarUrl = result.secure_url; // Get the secure URL from Cloudinary
    }

    // Generate and hash password
    const userPassword = generatePassword();
    const hashedPassword = await hash(userPassword, 10);

    // Create user
    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
      role,
      status: 'inactive',
      avatar: avatarUrl,
    });

    // Send email to user with their password
    await sendCreateUserEmail({ email, password: userPassword, role });

    // Respond with created user details (excluding sensitive info)
    res.status(201).json({
      message: 'User created successfully',
      user: { id: user._id, email: user.email, role, name, avatar: avatarUrl },
    });
  } catch (error: any) {
    // Handle specific errors
    console.log(error)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    return res.status(500).json({ message: 'Unable to create user', error: error.message });
  }
};

export const getAllUsers: RequestHandler = async (req, res) => {
  try {
    // Extract page and limit from query parameters, with defaults
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Fetch non-admin users with pagination, excluding passwords
    const users = await userModel
      .find({ role: { $ne: 'admin' } })
      .select('-password')
      .skip(skip)
      .limit(limit);

    // Get user statistics
    const totalUsers = await userModel.countDocuments();
    const totalAdmins = await userModel.countDocuments({ role: 'admin' });
    const totalActiveUsers = await userModel.countDocuments({ status: 'active' });
    const totalInactiveUsers = await userModel.countDocuments({ status: 'inactive' });
    const totalPages = Math.ceil((totalUsers - totalAdmins) / limit); // Total pages for non-admin users

    res.status(200).json({
      message: "Users fetched successfully",
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalNonAdminUsers: totalUsers - totalAdmins,
        limit
      },
      stats: {
        totalUsers,
        totalAdmins,
        totalActiveUsers,
        totalInactiveUsers
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch users", error });
  }
};

// Delete a user by ID
export const deleteUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent deletion of admin users
    const user = await userModel.findOne({ _id: id, role: { $ne: 'admin' } });
    
    if (!user) {
      return res.status(404).json({ message: "User not found or cannot delete admin" });
    }
    
    await userModel.deleteOne({ _id: id });
    
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete user", error });
  }
};


export const changeUserPassword: RequestHandler = async (req, res) => {
  const user = req.user.id;
  const { password } = req.body;
  const userExist = await userModel.findById(user);
  if (!userExist) return res.status(404).json({ message: "User not found" });

  try {
    const hashedPassword = await hash(password, 10);
    const passwordMatch = await compare(password, userExist.password);
    if(passwordMatch) return res.status(400).json({ message: "You cannot use your current password as new password!" });
    await userModel.findByIdAndUpdate(user, { password: hashedPassword });
    res.status(200).json({ message: "Password changed successfully" });
  }catch(error){
    res.status(500).json({ message: "Unable to change password" });
  }
}