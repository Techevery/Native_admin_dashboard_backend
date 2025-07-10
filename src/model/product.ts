import { model, ObjectId, Schema } from "mongoose";

interface Product {
  name: string;
  price: number;
  description: string;
  image: { id: string; url: string };
  category: ObjectId;
  status: string; // 'active' | 'inactive'
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
    status: { type: String, required: true },
  },
  { timestamps: true }
);

const productModel = model<Product>("Product", productSchema);
export default productModel;
