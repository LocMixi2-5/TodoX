import React, { useState } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

const AddTask = ({ handleNewTaskAdded }) => {

    const [newTaskTitle, setNewTaskTitle] = useState("");


    const addTask = async () => {
        if(newTaskTitle.trim())
        {
            try{
                await api.post("/tasks",
                    { title: newTaskTitle});
                toast.success(`Nhiệm vụ ${newTaskTitle} đã được thêm vào.`);
                handleNewTaskAdded();
            } catch (error) {
                console.log("Lỗi xảy ra khi thêm task.",error);
                toast.error("Lỗi xảy ra khi thêm nhiệm vụ mới.");

            }

            setNewTaskTitle("");
        }
        else 
        {
            toast.error("Bạn cần nhập nội dung của nhiệm vụ")
        }
    };

    const handleKeyPress = (event) => {
        if(event.key === 'Enter')
        {
            addTask();
        }
    };

    return (
        <Card className="p-6 border-0 bg-gradient-card shadow-custom-lg">
            <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                    type = "text"
                    placeholder = "Cần phải làm?"
                    className ="h-9 text-base bg-slate-50 sm:flex-1 border-border/50 focus:border-primary/ focus:ring-primary/15"
                    value = {newTaskTitle}
                    onChange={(even) => setNewTaskTitle(even.target.value)}
                    onKeyPress = {handleKeyPress}
                />

                <Button
                    variant = "gradient"
                    size = "lg"
                    className="px-4"
                    onClick = {addTask}
                    disabled = {!newTaskTitle.trim()}
                >
                    <Plus
                        className="size-4"
                    />

                    Thêm
                          

                </Button>
            </div>


        </Card>
    );
    
};

export default AddTask;