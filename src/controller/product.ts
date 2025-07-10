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

export const getAllProduct: RequestHandler = async (req, res) => {
  try {
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

    res.status(200).json({ success: true, products });
  }catch{
    res.status(500).json({ success: false, message: "Error getting products" });
  }
}

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

export const updateProduct: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { name, price, description, status } = req.body;
  const image = req.file;
  try {
    const product = await productModel.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    if (image && !Array.isArray(image)) {
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!allowedTypes.includes(image.mimetype)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid image format" });
      }
        if(product.image.id){
          await cloudinary.uploader.destroy(product.image.id);
        }
      await cloudinary.uploader.upload(image.path, { folder: "products" })
        .then((result) => {
          product.image.id = result.public_id;
          product.image.url = result.secure_url;
          product.name = name;
          product.price = price;
          product.description = description;
          product.status = status;
          product.save();
          res
            .status(200)
            .json({
              success: true,
              message: "Product updated successfully",
              product,
          })
        })
      }
  } catch{
    res
      .status(500)
      .json({ success: false, message: "Error updating product" });
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
