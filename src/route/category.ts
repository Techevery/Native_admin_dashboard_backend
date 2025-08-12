import { Router } from "express";
import { fileParser } from "../middleware/fileParser";
import { createCategory, deleteCategory, getCategory, getCategoryById, updateCategory } from "../controller/category";
import { isAdmin, isAuth } from "../middleware/auth";

const categoryRouter = Router()

categoryRouter.post("/create", isAuth, fileParser, createCategory)  
categoryRouter.get("/", getCategory)
categoryRouter.get("/:id", getCategoryById)   
categoryRouter.patch("/:id", fileParser, isAuth, isAdmin, updateCategory)
categoryRouter.delete("/:id", isAuth, isAdmin, deleteCategory)  

export default categoryRouter    