import { Router } from "express";
import { createSubCategory, fechSubCategoriesData } from "../controller/subcategory";

const subcategoryRouter = Router()

subcategoryRouter.post("/create", createSubCategory)
subcategoryRouter.get("/", fechSubCategoriesData)

export default subcategoryRouter