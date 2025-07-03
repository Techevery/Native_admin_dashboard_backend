import mongoose from "mongoose";

const uri = process.env.MONGODB_URI_TEST
if(!uri) throw new Error("MONGODB_URI is not defined")

export const dbConnect = () =>{
    mongoose.connect(uri).then(()=>{
        console.log('db connected')
    }).catch((error)=>{
        console.log('db connection failed:', error.message)
    })
}