import { model, Schema } from "mongoose";

interface UserDocs {
    email: string;
    password: string;
    name?: string;
    role: string;
}

const userSchema = new Schema<UserDocs>({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: false },
    role: { type: String, enum: ["admin", "user", "guest"], default: "admin" },
}, {timestamps: true});

const userModel = model("User", userSchema)

export default userModel