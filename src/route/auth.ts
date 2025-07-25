import { Router } from "express";
import { addNewUser, changeUserPassword, createUser, deleteUser, getAllUsers, login } from "../controller/auth";
import { isAdmin, isAuth } from "../middleware/auth";
import { fileParser } from "../middleware/fileParser";

const authRouter = Router()

authRouter.post("/login", login) 
authRouter.post("/add-user", fileParser, isAuth, isAdmin, addNewUser)
authRouter.post("/change-password", isAuth, changeUserPassword)
authRouter.get("/users", isAuth, isAdmin, getAllUsers)
authRouter.delete("/users/:id", isAuth, isAdmin, deleteUser) 

export default authRouter