import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import userModel from "../model/user";

declare global{
    namespace Express {
        export interface Request {
            user: {
                id: string;
                name?: string;
                email: string; 
                role: string,
            }
        }
    }
}   

export const isAuth: RequestHandler = async(req, res, next) => {
    const authToken = req.headers.authorization?.split(" ")[1];
    if (!authToken) {
        return res.status(401).json({ message: "No token provided" });
    }
    // const decodedToken = jwt.verify(token, process.env.JWT_SECRET as string);
    const payload = jwt.verify(authToken, process.env.JWT_SECRET!) as {id: string, role: string};
    const user = await userModel.findById(payload.id);
    if (!user) {
        return res.status(401).json({ message: "Unauthorized token user not found" });
    }
    req.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
    };
  
    next()

} 

export const isAdmin: RequestHandler = (req, res, next) => {
    if (req.user?.role !== "user") {
        return res.status(401).json({ message: `Unauthorized only admin can access this route` });
    }
    next()
}