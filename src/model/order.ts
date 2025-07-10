import { model, ObjectId, Schema } from "mongoose";

interface OrderDocs {
    email: string;
    item: ObjectId[]
    address: string;
    phone: string;
    paymentType: "whatsapp" | "card" 
    status: "pending" | "completed" | "cancelled"
}

const orderSchema = new Schema <OrderDocs>({
    email: {type: String, required: true},
    item: {type: [Schema.Types.ObjectId], ref: "Product", required: true},
    address: {type: String, required: true},
    phone: {type: String, required: true},
    paymentType: {type: String, enum: ["whatsapp", "card"], default: "whatsapp"},
    status: {type: String, enum: ["pending", "completed", "cancelled"], default: "pending"},
}, {timestamps: true})

const OrderModel = model("Order", orderSchema)

export default OrderModel