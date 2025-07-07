import { Router } from "express";
import { createSubCategory } from "../controller/subcategory";

const subcategoryRouter = Router()

subcategoryRouter.post("/create", createSubCategory)

export default subcategoryRouter