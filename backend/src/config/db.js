import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error("MONGODB_URI is not defined in environment variables");
        }
        await mongoose.connect(uri);
        
        console.log("Liên kết CSDL thành công");
    } catch (error) {

        console.log("Lỗi khi kết nối CSDL:", error);
        process.exit(1);// exit with error
    }

};