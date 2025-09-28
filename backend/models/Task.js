import mongoose from "mongoose";

const taskShcema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["active", "complete"],
            default: "active",
        },
        completedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Task = mongoose.model("Task", taskShcema);

export default Task;