import mongoose, { isValidObjectId } from "mongoose";
import cloudinary from "../cloud";
import CategoryModel from "../model/category";
import { Request, Response } from "express";import OrderModel from "../model/order";

export const getCategory = async (req: Request, res: Response) => {
    try {
        // Aggregate categories with subcategories
        const categories = await CategoryModel.aggregate([
            {
                $lookup: {
                    from: "subcategories",
                    localField: "subcategories",
                    foreignField: "_id",
                    as: "subcategories" 
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    status: 1,
                    image: { url: 1 },
                    subcategoryCount: { $size: "$subcategories" },
                    subcategories: {
                        $map: {
                            input: "$subcategories",
                            as: "subcategory",
                            in: {
                                _id: "$$subcategory._id",
                                name: "$$subcategory.name"
                            }
                        }
                    }
                }
            }
        ]);

        // Get total number of categories
        const totalCategories = await CategoryModel.countDocuments();

        // Get total number of active categories
        const totalActiveCategories = await CategoryModel.countDocuments({ status: 'active' });

        // Find the most ordered category
        const mostOrderedCategory = await OrderModel.aggregate([
            {
                $unwind: "$item"
            },
            {
                $lookup: {
                    from: "products",
                    localField: "item.product",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            {
                $unwind: "$productInfo"
            },
            {
                $group: {
                    _id: "$productInfo.category",
                    totalOrdered: { $sum: "$item.quantity" }
                }
            },
            {
                $sort: { totalOrdered: -1 }
            },
            {
                $limit: 1
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "_id",
                    foreignField: "_id",
                    as: "categoryInfo"
                }
            },
            {
                $unwind: "$categoryInfo"
            },
            {
                $project: {
                    _id: "$categoryInfo._id",
                    name: "$categoryInfo.name",
                    totalOrdered: 1
                }
            }
        ]);

        if (!categories.length) {
            return res.status(404).json({ 
                message: "No categories found",
                totalCategories: 0,
                totalActiveCategories: 0,
                mostOrderedCategory: null
            });
        }

        return res.status(200).json({
            categories,
            totalCategories,
            totalActiveCategories,
            mostOrderedCategory: mostOrderedCategory.length ? mostOrderedCategory[0] : null
        });
    } catch (error) {
        return res.status(500).json({ 
            message: "Error fetching categories", 
            error 
        });
    }
}
   
export const createCategory = async (req: any, res: any) => {
    try {
        const {image} = req.files;
        const { name, description, status, subcategories } = req.body;
        const newCategory = new CategoryModel({ name, description, status, subcategories });
        if(image && !Array.isArray(image) && image.mimetype?.startsWith("image")){
            const result = await cloudinary.uploader.upload(image.filepath, { folder: "categories" });
            newCategory.image = {
                id: result.public_id,
                url: result.secure_url
            };
        }
        await newCategory.save();
        return res.status(201).json(newCategory);
    } catch (error) {
        return res.status(500).json({ message: "Error creating category", error });
    }
}

export const getCategoryById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const category = await CategoryModel.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(id) } },
            { 
                $lookup: {
                    from: "subcategories",
                    localField: "subcategories", // Assuming subcategories is an array of ObjectIds in Category
                    foreignField: "_id",
                    as: "subcategories"
                }
            },
            {
                $project: {   
                    _id: 1,
                    name: 1,
                    description: 1,
                    status: 1,
                    image: { url: 1 }, // Include image if needed
                    subcategories: {
                        $map: {
                            input: "$subcategories",
                            as: "subcategory",
                            in: {
                                _id: "$$subcategory._id",
                                name: "$$subcategory.name",
                            }
                        }
                    }
                }
            }
        ]);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        return res.status(200).json(category);
    } catch (error) {
        return res.status(500).json({ message: "Error fetching category", error });
    }
}


interface Category {
  name: string;
  description: string;
  status: string;
  image?: { id: string; url: string };
    // subcategories?: string[]; // Array of SubCategory IDs
    subcategories?: string[] | string; // Allow both single and multiple subcategory IDs
}

export const updateCategory = async (req: Request, res: Response) => {
    console.log("running updateCategory");
  const { id } = req.params;
  const { name, description, status, subcategories } = req.body;
  const { image } = req.files as { image?: any }; // Adjust based on your file upload middleware

  // Validate ID
  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'Invalid category ID' });
  }

  try {
    // Build update data dynamically
    const updateData: Partial<Category> = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (status) updateData.status = status;
    // if(subcategories) updateData.subcategories = Array.isArray(subcategories) ? subcategories : [subcategories];
    if(subcategories) updateData.subcategories = subcategories

    // Handle image update
    const category = await CategoryModel.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (image && !Array.isArray(image)) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(image.mimetype)) {
        return res.status(400).json({ success: false, message: 'Invalid image format' });
      }

      // Delete old image if it exists
      if (category.image && category.image.id) {
        try {
          await cloudinary.uploader.destroy(category.image.id);
        } catch (deleteError) {
          console.error('Error deleting old image:', deleteError);
          // Optionally, return an error or proceed
        }
      }

      // Upload new image
      const result = await cloudinary.uploader.upload(image.filepath, { folder: 'categories' });
      updateData.image = {
        id: result.public_id,
        url: result.secure_url,
      };
    }

    // Update category
    const updatedCategory = await CategoryModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedCategory) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    return res.status(200).json({ success: true, data: updatedCategory });
  } catch (error) {
    console.error('Error updating category:', error);
    return res.status(500).json({ success: false, message: 'Error updating category', error });
  }
};   

export const deleteCategory = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const category = await CategoryModel.findByIdAndDelete(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        } else if(category.image && category.image.id) {
            // Delete image from Cloudinary if it exists
            await cloudinary.uploader.destroy(category.image.id);
        }
        return res.status(200).json({ message: "Category deleted successfully" });
        }
    catch (error) {
        return res.status(500).json({ message: "Error deleting category", error });
    }
}
