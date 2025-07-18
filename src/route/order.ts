import { Router } from "express";
import { createOrder } from "../controller/order";

const orderRouter = Router()

orderRouter.post("/checkout", createOrder)  

export default orderRouter 