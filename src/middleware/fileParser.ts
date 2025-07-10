import { RequestHandler } from "express";
import formidable , { File } from "formidable";

// declare global {
//     namespace Express {
//         interface Request {
//             // files: {[key: string]: File | File[]};
//             files: Record<string, File| File[] | undefined>;   
//         }
//     }
// }

// Augment the Express module
declare module "express-serve-static-core" {
  interface Request {
    files: Record<string, formidable.File | formidable.File[] | undefined>;
  }
}

export const fileParser: RequestHandler = async (req, res, next)=>{
    console.log("middleware fileParser running");
    const form = formidable()
    const [fields, files] = await form.parse(req)
    if(!req.body) req.body = {}
    if(!req.files) req.files = {}

    console.log("files", files)

    for(const key in fields){
        const filedValue = fields[key]
        if(filedValue) req.body[key] = filedValue[0]
    }

    for(const key in files){
        const filedValue = files[key]
        if(filedValue) {
            if(filedValue.length > 1){
                req.files[key] = filedValue
            }else{
                req.files[key] = filedValue[0]
            }
        }
    }

    next()
}