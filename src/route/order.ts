import { Router } from "express";
import { createOrder, fetchOrders, updateOrderStatus } from "../controller/order";

const orderRouter = Router()

orderRouter.post("/checkout", createOrder)  
orderRouter.get("/", fetchOrders)
orderRouter.patch("/:orderId", updateOrderStatus)

export default orderRouter 