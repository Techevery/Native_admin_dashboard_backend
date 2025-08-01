import { model, ObjectId, Schema } from "mongoose";

// Define the ProductItem interface
interface ProductItem {
    product: ObjectId;
    quantity: number;
}

// Define the OrderDocs interface
interface OrderDocs {
    email: string;
    item: ProductItem[];
    address: string;
    phone: string;
    paymentType: "whatsapp" | "card";
    status: "pending" | "completed" | "cancelled";
    reference: string;
}

// Define the ProductItem schema
const productItemSchema = new Schema<ProductItem>({
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
});

// Define the Order schema
const orderSchema = new Schema<OrderDocs>(
    {
        email: { type: String, required: true },
        item: { type: [productItemSchema], required: true }, // Use the subdocument schema
        address: { type: String, required: true },
        phone: { type: String, required: true },
        paymentType: {
            type: String,
            enum: ["whatsapp", "card"],
            default: "whatsapp",
        },
        status: {
            type: String,
            enum: ["pending", "completed", "cancelled"],
            default: "pending",
        },
        reference: { type: String },
    },
    { timestamps: true }
);

// Create and export the Order model
const OrderModel = model<OrderDocs>("Order", orderSchema);

export default OrderModel;