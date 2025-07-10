import { Router } from "express";
import { createProduct, getAllProduct, getProduct } from "../controller/product";
import { fileParser } from "../middleware/fileParser";

const productRouter = Router()

productRouter.post("/create", fileParser, createProduct)
productRouter.get("/", getAllProduct)    
productRouter.get("/:id", getProduct)


export default productRouter;