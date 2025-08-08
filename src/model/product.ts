import { model, ObjectId, Schema } from "mongoose";

interface Product {
  name: string;
  price: number;
  description: string;
  image: { id: string; url: string };
  category: ObjectId;
  status: string;
  stock: "In Stock" | "Out of Stock" | "Low in Stock";
}

const productSchema = new Schema<Product>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    image: {
     id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true 
        }
    },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    stock: {type: String, enum: ["In Stock", "Out of Stock", "Low in Stock"], default: "In Stock" },
  },
  { timestamps: true }
);

const productModel = model<Product>("Product", productSchema);
export default productModel;
