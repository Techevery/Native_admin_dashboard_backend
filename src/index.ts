import express from 'express'
import 'dotenv/config';
import { dbConnect } from './db';
import categoryRouter from './route/category';
import subcategoryRouter from './route/subcategory';
import productRouter from './route/product';
import orderRouter from './route/order';
import authRouter from './route/auth';

const app = express()   
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.send('Hello World!')     
})
app.use("/category", categoryRouter)
app.use("/subcategory", subcategoryRouter)
app.use("/product", productRouter) 
app.use("/order", orderRouter)
app.use("/auth", authRouter)
    
dbConnect()
 
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);   
})  