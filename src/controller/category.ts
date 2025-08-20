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
    const { image } = req.files;
    let { name, description, status, subcategories } = req.body;

    // Parse subcategories if received as a JSON string
    if (typeof subcategories === 'string') {
      try {
        subcategories = JSON.parse(subcategories);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid subcategories format' });
      }
    }

    // Validate subcategories is an array of valid ObjectIds
    if (subcategories && !Array.isArray(subcategories)) {
      return res.status(400).json({ message: 'Subcategories must be an array' });
    }
    if (subcategories?.some((id: string) => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ message: 'Invalid subcategory ID' });
    }

    const newCategory = new CategoryModel({ name, description, status, subcategories });
    if (image && !Array.isArray(image) && image.mimetype?.startsWith('image')) {
      const result = await cloudinary.uploader.upload(image.filepath, { folder: 'categories' });
      newCategory.image = {
        id: result.public_id,
        url: result.secure_url,
      };
    }
    await newCategory.save();
    return res.status(201).json(newCategory);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Error creating category', error });
  }
};

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
  const { id } = req.params;
  const { name, description, status, subcategories } = req.body;
  const { image } = req.files as { image?: any };

  // Validate ID     
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid category ID' });
  }

  try {
    // Parse subcategories if received as a JSON string
    let parsedSubcategories = subcategories;
    if (typeof subcategories === 'string') {
      try {
        parsedSubcategories = JSON.parse(subcategories);
      } catch (error) {
        return res.status(400).json({ success: false, message: 'Invalid subcategories format' });
      }
    }

    // Validate subcategories is an array of valid ObjectIds
    if (parsedSubcategories && !Array.isArray(parsedSubcategories)) {
      return res.status(400).json({ success: false, message: 'Subcategories must be an array' });
    }
    if (parsedSubcategories?.some((id: string) => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ success: false, message: 'Invalid subcategory ID' });
    }

    // Build update data dynamically
    const updateData: Partial<Category> = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (status) updateData.status = status;
    if (parsedSubcategories) updateData.subcategories = parsedSubcategories;

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
    const updatedCategory = await CategoryModel.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
    if (!updatedCategory) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    return res.status(200).json({ success: true, data: updatedCategory });
  } catch (error) {
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
