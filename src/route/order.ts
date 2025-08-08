import { Router } from "express";
import { createOrder, fetchOrders, getOrderById, statistics, updateOrderStatus } from "../controller/order";

const orderRouter = Router()

orderRouter.post("/checkout", createOrder)  
orderRouter.get("/", fetchOrders)
orderRouter.get("/statistics", statistics)
orderRouter.patch("/:orderId", updateOrderStatus)
orderRouter.get("/:orderId", getOrderById)

export default orderRouter 