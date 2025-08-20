import { Router } from "express";
import { createProduct, deleteProduct, getAllProduct, getProduct, updateProduct } from "../controller/product";
import { fileParser } from "../middleware/fileParser";
import { isAdmin, isAuth } from "../middleware/auth";

const productRouter = Router()

productRouter.post("/create", isAuth, isAdmin, fileParser, createProduct)
productRouter.get("/", getAllProduct)    
productRouter.get("/:id", getProduct)
productRouter.patch("/:id", isAuth, isAdmin, fileParser, updateProduct)
productRouter.delete("/:id", isAuth, isAdmin, deleteProduct)


export default productRouter;