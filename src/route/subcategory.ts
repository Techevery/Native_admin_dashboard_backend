import { Router } from 'express';
import { createSubCategory, fetchSubCategoriesData, updateSubCategory, deleteSubCategory } from '../controller/subcategory';
import { isAuth } from '../middleware/auth';

const subcategoryRouter = Router();

subcategoryRouter.post('/create', isAuth, createSubCategory);
subcategoryRouter.get('/', fetchSubCategoriesData);
subcategoryRouter.put('/:id', isAuth, updateSubCategory);
subcategoryRouter.delete('/:id', isAuth, deleteSubCategory);

export default subcategoryRouter;