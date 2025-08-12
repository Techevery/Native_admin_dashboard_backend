import { RequestHandler } from "express";
import productModel from "../model/product";
import cloudinary from "../cloud";
import mongoose from "mongoose";

export const createProduct: RequestHandler = async (req, res) => {
  const { name, price, description, status, category } = req.body;
  const {image} = req.files as any;

  try {
    // Validate required fields
    if (!name || !price || !status) {   
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }

    // Create product instance
    const product = new productModel({
      name,
      price,
      description,
      status,
      category,
      image: { id: '', url: '' }, // Initialize image object
    });

    // Handle image upload
    if (image && !Array.isArray(image)) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
     if (!allowedTypes.includes(image.mimetype)) {
        return res.status(400).json({ success: false, message: 'Invalid image format' });
      }

      try {
        const result = await cloudinary.uploader.upload(image.filepath, {
          folder: 'products',
        }); 
        product.image.id = result.public_id;
        product.image.url = result.secure_url;
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        return res
          .status(500)
          .json({ success: false, message: 'Error uploading image' });
      }
    } else if (image && Array.isArray(image)) {
      return res
        .status(400)
        .json({ success: false, message: 'Only one image is allowed' });
    }

   // Save product to database
    await product.save();

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    // console.error('Error creating product:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Error creating product', error });
  }
};

// export const getAllProduct: RequestHandler = async (req, res) => {
//   try {
//     const products = await productModel.aggregate([
//       {
//         $lookup: {
//           from: "categories",
//           localField: "category",
//           foreignField: "_id",
//           as: "category",
//         },
//       },
//       { $unwind: "$category" },   
//       {
//         $lookup: {
//           from: "subcategories",
//           localField: "category.subcategories",
//           foreignField: "_id",
//           as: "category.subcategories",
//         },
//       },
//       {
//         $project: {
//           _id: 1,
//           name: 1,
//           price: 1,
//           description: 1,
//           status: 1,
//           image: "$image.url", // Only include the image URL
//           category: {
//             name: "$category.name",
//             subcategory: {
//               $arrayElemAt: ["$category.subcategories.name", 0], // Get first subcategory name
//             },
//           },
//         },
//       },
//     ]);

//     res.status(200).json({ success: true, products });
//   }catch{
//     res.status(500).json({ success: false, message: "Error getting products" });
//   }
// }

export const getAllProduct: RequestHandler = async (req, res) => {
  try {
    // Fetch products with category and subcategory details
    const products = await productModel.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $lookup: {
          from: "subcategories",
          localField: "subCategory", // Use subCategory field directly
          foreignField: "_id",
          as: "subCategoryDetails",
        },
      },
      {
        $unwind: {
          path: "$subCategoryDetails",
          preserveNullAndEmptyArrays: true, // Allow products with no subcategory
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          description: 1,
          status: 1,
          stock: 1,
          image: "$image.url",
          category: {
            _id: "$category._id",
            name: "$category.name",
          },
          subCategory: {
            _id: "$subCategoryDetails._id",
            name: "$subCategoryDetails.name",
          },
        },
      },
    ]);

    // Fetch summary statistics
    const stats = await productModel.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalActive: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          totalInStock: {
            $sum: { $cond: [{ $eq: ["$stock", "In Stock"] }, 1, 0] },
          },
          totalOutOfStock: {
            $sum: { $cond: [{ $eq: ["$stock", "Out of Stock"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalProducts: 1,
          totalActive: 1,
          totalInStock: 1,
          totalOutOfStock: 1,
        },
      },
    ]);

    // Extract stats
    const summary = stats[0] || {
      totalProducts: 0,
      totalActive: 0,
      totalInStock: 0,
      totalOutOfStock: 0,
    };

    // Send response with products and summary statistics
    res.status(200).json({
      success: true,
      products,
      summary,
    });
  } catch (error) {
    console.error("Error getting products:", error);
    res.status(500).json({ success: false, message: "Error getting products" });
  }
};

export const getProduct: RequestHandler = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await productModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },   
      {
        $lookup: {
          from: "subcategories",
          localField: "category.subcategories",
          foreignField: "_id",
          as: "category.subcategories",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          description: 1,
          status: 1,
          image: "$image.url", // Only include the image URL
          category: {
            name: "$category.name",
            subcategory: {
              $arrayElemAt: ["$category.subcategories.name", 0], // Get first subcategory name
            },
          },
        },
      },
    ]);

    if (!product || product.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, product: product[0] });
  } catch (error) {
    console.error("Error getting product:", error);
    res
      .status(500)
      .json({ success: false, message: "Error getting product", error });
  }
};

// export const updateProduct: RequestHandler = async (req, res) => {
//   const { id } = req.params;
//   const { name, price, description, status } = req.body;
//   const image = req.file;
//   try {
//     const product = await productModel.findById(id);
//     if (!product) {
//       return res.status(404).json({ success: false, message: "Product not found" });
//     }
//     if (image && !Array.isArray(image)) {
//       const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
//       if (!allowedTypes.includes(image.mimetype)) {
//         return res
//           .status(400)
//           .json({ success: false, message: "Invalid image format" });
//       }
//         if(product.image.id){
//           await cloudinary.uploader.destroy(product.image.id);
//         }
//       await cloudinary.uploader.upload(image.path, { folder: "products" })
//         .then((result) => {
//           product.image.id = result.public_id;
//           product.image.url = result.secure_url;
//           product.name = name;
//           product.price = price;
//           product.description = description;
//           product.status = status;
//           product.save();
//           res
//             .status(200)
//             .json({
//               success: true,
//               message: "Product updated successfully",
//               product,
//           })
//         })
//       }
//   } catch{
//     res
//       .status(500)
//       .json({ success: false, message: "Error updating product" });
//   }
// }

export const updateProduct: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { name, price, description, status, category, subCategory, stock } = req.body;
  const image = req.file;
  console.log(req.body, id, "bdy")

  try {
    // Validate product ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    // Find the product
    const product = await productModel.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Update fields if provided
    if (name) product.name = name;
    if (price) product.price = Number(price);
    if (description) product.description = description;
    if (status) product.status = status;
    if (stock) product.stock = stock;

    // Validate and update category if provided
    if (category) {
      if (!mongoose.isValidObjectId(category)) {
        return res.status(400).json({ success: false, message: "Invalid category ID" });
      }
      product.category = category;
    }

    // Handle image upload if provided
    if (image && !Array.isArray(image)) {
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!allowedTypes.includes(image.mimetype)) {
        return res.status(400).json({ success: false, message: "Invalid image format" });
      }

      // Delete existing image from Cloudinary if it exists
      if (product.image?.id) {
        await cloudinary.uploader.destroy(product.image.id);
      }

      // Upload new image to Cloudinary
      const result = await cloudinary.uploader.upload(image.path, { folder: "products" });
      product.image = {
        id: result.public_id,
        url: result.secure_url,
      };
    }

    // Save the updated product
    await product.save();

    // Populate category and subCategory for response
    const populatedProduct = await productModel
      .findById(id)
      .populate("category", "name")

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: populatedProduct,
    });
  } catch (error: any) {
    console.error("Error updating product:", {
      message: error.message,
      stack: error.stack,       
    });
    return res.status(500).json({ success: false, message: "Error updating product", error: error.message });
  }
}

export const deleteProduct: RequestHandler = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await productModel.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    if(product.image.id){            
      await cloudinary.uploader.destroy(product.image.id);
    }
    await product.deleteOne();
  }catch(error){
    res  
      .status(500)
      .json({ success: false, message: "Error deleting product" });
  }
}
