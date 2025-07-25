import SubCategoryModel from "../model/subcategory";

export const createSubCategory = async (req: any, res: any) => {
    // create subcategory
    const {name} = req.body;
    try {  
        if (!name) {
            return res.status(400).json({ message: "Name and Category ID are required" });
        }
        
        const newSubCategory = new SubCategoryModel({ name });
        await newSubCategory.save();
        
        return res.status(201).json(newSubCategory);
    } catch (error) {
        return res.status(500).json({ message: "Error creating subcategory", error });
    }
}