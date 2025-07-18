import { RequestHandler } from "express";
import userModel from "../model/user";
import { hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import { generatePassword } from "../utils/password-generator";
import { sendCreateUserEmail } from "../utils/email";
 
export const login: RequestHandler = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch)
      return res.status(401).json({ message: "Invalid password" });

    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET as string);
    res.status(200).json({ message: "user login successful", token });
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
  const { name, email, role } = req.body;     
  try { 
   const  userPassword = generatePassword()
    const hashedPassword = await hash(userPassword, 10);
    const user = await userModel.create({ name, email, password: hashedPassword, role });
    // send email to user with password
    await sendCreateUserEmail({email, password: userPassword, role})
    res.status(201).json({ message: "user created successfully", user: {id: user._id, email: user.email} });
  } catch (error) {
    return res.status(500).json({message: "Unable to create user", error})       
  }
}                