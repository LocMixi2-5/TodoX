import React from "react";

const NotFound = () => {
    return (
    
        <div className = "flex flex-col items-center justify-center min-h-screen text-center bg-slate-50">
            <img 
                src = "404_NotFound.png" 
                alt = "ảnh lỗi" 
                className = "max-w-full mb-6 w-96"
            />

            <p className = "text-xl font-semibold">
                Bạn đang vào vùng cấm 🚫
            </p>

            <a 
                href = "/" 
                className="inline-block px-10 py-3 mt-10 font-medium text-white transition shadow-md bg-primary rounded-3xl hover:bg-primary-dark"
            >
                Quay về trang chủ 
            </a>

        </div>

    );
};

export default NotFound;