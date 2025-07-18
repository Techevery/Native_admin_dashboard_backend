import { Router } from "express";
import { createProduct, getAllProduct, getProduct } from "../controller/product";
import { fileParser } from "../middleware/fileParser";
import { isAdmin, isAuth } from "../middleware/auth";

const productRouter = Router()

productRouter.post("/create",isAuth, isAdmin, fileParser, createProduct)
productRouter.get("/", getAllProduct)    
productRouter.get("/:id", getProduct)


export default productRouter;