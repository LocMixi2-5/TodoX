import React, { useState } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Plus, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

const AddTask = ({ handleNewTaskAdded }) => {

    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [deadline, setDeadline] = useState("");
    const [showDeadline, setShowDeadline] = useState(false);


    const addTask = async () => {
        if(newTaskTitle.trim())
        {
            try{
                await api.post("/tasks",
                    { title: newTaskTitle, deadline: deadline || null });
                toast.success(`Nhiệm vụ ${newTaskTitle} đã được thêm vào.`);
                handleNewTaskAdded();
            } catch (error) {
                console.log("Lỗi xảy ra khi thêm task.",error);
                toast.error("Lỗi xảy ra khi thêm nhiệm vụ mới.");

            }

            setNewTaskTitle("");
            setDeadline("");
            setShowDeadline(false);
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

                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="lg"
                        className={`px-3 ${showDeadline ? 'text-violet-600 bg-violet-50' : 'text-zinc-400'}`}
                        onClick={() => setShowDeadline(!showDeadline)}
                        title="Đặt hạn chót"
                    >
                        <CalendarClock className="size-5" />
                    </Button>

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
            </div>

            {showDeadline && (
                <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm text-zinc-500">Hạn chót:</span>
                    <input
                        type="datetime-local"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="flex-1 h-9 px-3 text-sm rounded-lg border border-zinc-200 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
                    />
                    {deadline && (
                        <button
                            onClick={() => { setDeadline(""); setShowDeadline(false); }}
                            className="text-xs text-red-500 hover:text-red-700"
                        >
                            Xóa
                        </button>
                    )}
                </div>
            )}

        </Card>
    );
    
};

export default AddTask;