// import { RequestHandler } from "express";
// import SubCategoryModel from "../model/subcategory";

// export const createSubCategory = async (req: any, res: any) => {
//     // create subcategory
//     const {name} = req.body;

//     console.log(name, "data")
//     try {  
//         if (!name) {
//             return res.status(400).json({ message: "Name and Category ID are required" });
//         }
        
//         const newSubCategory = new SubCategoryModel({ name });
//         await newSubCategory.save();
        
//         return res.status(201).json(newSubCategory);
//     } catch (error) {
//         // console.log(error)
//         return res.status(500).json({ message: "Error creating subcategory", error });
//     }   
// }


// export const fechSubCategoriesData = async (req: any, res: any) => {
//     try {
//         const subcategories = await SubCategoryModel.find() 
//         return res.status(201).json(subcategories)
//     } catch (error: any) {
//         throw new Error(error)
//     }
// }



import { Request, Response } from 'express';
import SubCategoryModel from '../model/subcategory';

export const createSubCategory = async (req: Request, res: Response) => {
  const { name } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newSubCategory = new SubCategoryModel({ name });
    await newSubCategory.save();

    return res.status(201).json(newSubCategory);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error creating subcategory', error });
  }
};

export const fetchSubCategoriesData = async (req: Request, res: Response) => {
  try {
    const subcategories = await SubCategoryModel.find();
    return res.status(200).json(subcategories);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error fetching subcategories', error });
  }
};

export const updateSubCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedSubCategory = await SubCategoryModel.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );

    if (!updatedSubCategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    return res.status(200).json(updatedSubCategory);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error updating subcategory', error });
  }
};

export const deleteSubCategory = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const deletedSubCategory = await SubCategoryModel.findByIdAndDelete(id);

    if (!deletedSubCategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    return res.status(200).json({ message: 'Subcategory deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error deleting subcategory', error });
  }
};