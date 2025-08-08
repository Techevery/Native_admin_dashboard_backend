import express from 'express'
import 'dotenv/config';
import { dbConnect } from './db';
import categoryRouter from './route/category';
import subcategoryRouter from './route/subcategory';
import productRouter from './route/product';
import orderRouter from './route/order';
import authRouter from './route/auth';
import cors from "cors";
import { seedAdmin } from './utils/seed';

const app = express()   
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
 
app.get('/', (req, res) => {  
  res.send('Hello World!')     
}) 


const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', "https://native-delight-admin.vercel.app", "https://native-delight-admin-jhjiprsbp-amiscripts-projects.vercel.app"]

app.use(cors({
  origin: (origin, callback) => { 
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } 

    return callback(new Error('Not allowed by CORS'));
  }
}));
   
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