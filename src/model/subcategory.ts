import { model, ObjectId, Schema } from "mongoose";

interface Subcategory{
    name: string;
    status: 'active' | 'inactive';
}

const subcategorySchema = new Schema<Subcategory>({
    name: { type: String, required: true },
    status: {type: String, enum: ['active', 'inactive'], default: 'active'}
}, {timestamps: true});

const SubCategoryModel = model<Subcategory>('Subcategory', subcategorySchema);

export default SubCategoryModel;