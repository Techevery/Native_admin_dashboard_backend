import { model, Schema } from "mongoose";

interface UserDocs {
    email: string;
    password: string;
    name?: string;
    role: string;
    status: string;
}

const userSchema = new Schema<UserDocs>({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: false },
    role: { type: String, enum: ["admin", "user", "guest"], default: "admin" },
    status: {type: String, enum: ["active", "inactive"], default: "inactive" },
}, {timestamps: true});

const userModel = model("User", userSchema)

export default userModel