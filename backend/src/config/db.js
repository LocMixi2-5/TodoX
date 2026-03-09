import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGODB_CONNECTIONGSTRING;
        if (!uri) {
            throw new Error("Neither MONGODB_URI nor MONGODB_CONNECTIONGSTRING is defined in environment variables");
        }
        await mongoose.connect(uri);
        
        console.log("Liên kết CSDL thành công");
    } catch (error) {

        console.log("Lỗi khi kết nối CSDL:", error);
        process.exit(1);// exit with error
    }

};