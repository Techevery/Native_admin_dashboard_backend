import { model, Schema } from "mongoose";

interface Category{
    name: string;
    description: string;
    subcategories?: string[]; // Array of SubCategory IDs
    status:  'active' | 'inactive'
    image: {id: string, url: string};
}

const categorySchema = new Schema<Category>({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    subcategories: [{
        type: Schema.Types.ObjectId,
        ref: 'SubCategory'
    }],
    image: {
        id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    }
}, {timestamps: true});

const CategoryModel = model<Category>('Category', categorySchema);

export default CategoryModel;
