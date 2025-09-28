import AddTask from "@/components/AddTask";
import { Header } from "@/components/Header";
import DateTimeFilter from "@/components/DateTimeFilter";
import Footer from "@/components/Footer";
import StatsAndFilters from "@/components/StatsAndFilters";
import TaskList from "@/components/TaskList";
import TaskListPagination from "@/components/TaskListPagination";
import React, { useEffect, useState} from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { visibleTaskLimit } from "@/lib/data";

const HomePage = () => {
    const [taskBuffer, setTaskBuffer] = useState([]);
    const [ activeTaskCount, setActiveTaskCount ] = useState(0);
    const [ completeTaskCount, setCompleteTaskCount] = useState(0);
    const [ filter, setFilter] = useState("all");
    const [dateQuery, setDateQuery] = useState('today');
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchTasks();
    }, [dateQuery]);

    useEffect(() => {
        setPage(1);
    }, [filter, dateQuery]);

    //logic đếm việc và cho phép backend
    const fetchTasks = async () => {
        try {
                const res = await api.get(`/tasks?filter=${dateQuery}`);

                const {tasks , activeCount , completeCount} = res.data;

                setTaskBuffer(tasks);
                setActiveTaskCount(activeCount);
                setCompleteTaskCount(completeCount);

            }
         catch (error) {
            console.error("Lỗi xảy ra khi truy xuất tasks:", error);
            toast.error("Lỗi xảy ra khi truy xuất tasks.");
         }
    };

    // biến 
    const filteredTasks = taskBuffer.filter((task) => {
        switch (filter) 
        {
            case 'active':
                return task.status === 'active';
            case 'completed':
                return task.status === 'complete';
            default:
                return true;
        }
    });

    const handlePrev = () => {
        if(page > 1) {
            setPage((prev) => prev - 1);
        }
    };

    const visibleTasks = filteredTasks.slice(
        (page - 1) * visibleTaskLimit,
        page * visibleTaskLimit
    );
    
    if(visibleTasks.length === 0){
        handlePrev();
    }

    const totalPages = Math.ceil(filteredTasks.length / visibleTaskLimit);

   
    const handleTaskChanged = () => {
        fetchTasks();
    };

    const handleNext = () => {
        if(page < totalPages) {
            setPage((prev) => prev + 1);
        }
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };


    return (
    <div className="min-h-screen w-full bg-[#f0fdfa] relative">
        {/* Mint Fresh Breeze Background */}
        <div
            className="absolute inset-0 z-0"
            style={{
            backgroundImage: `
                linear-gradient(45deg, 
                rgba(240,253,250,1) 0%, 
                rgba(204,251,241,0.7) 30%, 
                rgba(153,246,228,0.5) 60%, 
                rgba(94,234,212,0.4) 100%
                ),
                radial-gradient(circle at 40% 30%, rgba(255,255,255,0.8) 0%, transparent 40%),
                radial-gradient(circle at 80% 70%, rgba(167,243,208,0.5) 0%, transparent 50%),
                radial-gradient(circle at 20% 80%, rgba(209,250,229,0.6) 0%, transparent 45%)
            `,
            }}
        />
        {/* Your Content/Components */}
    
            <div className="container pt-8 mx-auto relative z-10">
            <div className="w-full max-w-2xl mx-auto space-y-6 p-6">

                {/* Đầu trang*/}
                <Header/>

                {/* Tạo việc*/}
                <AddTask
                    handleNewTaskAdded = {handleTaskChanged}
                />

                {/*Kiểm kê và bộ lọc*/}
                <StatsAndFilters
                    filter = {filter}
                    setFilter = {setFilter}
                    activeTasksCount={activeTaskCount}
                    completedTasksCount={completeTaskCount}
                />

                {/* Danh sách nhiệm vụ*/}
                <TaskList 
                    filteredTasks={visibleTasks}
                    filter={filter}
                    handleTaskChanged={handleTaskChanged}
                    
                />

                {/* Phân trang và Lọc theo Date */}
                <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
                    <TaskListPagination
                        handleNext={handleNext}
                        handlePrev={handlePrev}
                        handlePageChange={handlePageChange}
                        page={page}
                        totalPages={totalPages }
                    />
                    <DateTimeFilter
                        dateQuery = {dateQuery} 
                        setDateQuery = {setDateQuery}
                    />
                </div>

                {/* Chân trang*/}
                <Footer 
                    activeTasksCount={activeTaskCount}
                    completedTasksCount={completeTaskCount}
                />
            </div>
        </div>
    </div>   
    
    );
    
};

export default HomePage;