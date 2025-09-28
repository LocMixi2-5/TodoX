import mongoose from "mongoose";

export const connectDB = async () => {
    try{
        await mongoose.connect(
            process.env.MONGODB_CONNECTIONGSTRING);
        
        console.log("Liên kết CSDL thành công");
    } catch (error) {

        console.log("Lỗi khi kết nối CSDL:", error);
        process.exit(1);// exit with error
    }

};