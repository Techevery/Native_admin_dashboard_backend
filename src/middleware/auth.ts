import { RequestHandler } from "express";

declare global {
    namespace Express {
        interface Request {
            user: any;
        }
    }
}

export const isAuth: RequestHandler = (req, res, next) => {
    if (req.user) {
        return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
}  