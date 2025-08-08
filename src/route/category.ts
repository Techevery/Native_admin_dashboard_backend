import { Router } from "express";
import { fileParser } from "../middleware/fileParser";
import { createCategory, deleteCategory, getCategory, getCategoryById, updateCategory } from "../controller/category";
import { isAdmin, isAuth } from "../middleware/auth";

const categoryRouter = Router()

categoryRouter.post("/create", fileParser, createCategory)  
categoryRouter.get("/", getCategory)
categoryRouter.get("/:id", getCategoryById)
categoryRouter.patch("/:id", fileParser, updateCategory)
categoryRouter.delete("/:id", deleteCategory)  

export default categoryRouter    