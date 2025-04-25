import mongoose from "mongoose";

export async function connectToDB() {
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI)
    }catch (error){
        process.exit(1)
    }
}