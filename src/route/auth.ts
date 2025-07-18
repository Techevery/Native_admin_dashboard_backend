import { Router } from "express";
import { addNewUser, createUser, login } from "../controller/auth";

const authRouter = Router()

authRouter.post("/create", createUser)
authRouter.post("/login", login) 
authRouter.post("/add-user", addNewUser)

export default authRouter