import React from "react";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut } from "lucide-react";

export const Header = () => {
    const { authUser, logout } = useAuthStore();

    return (
    <div className="space-y-3 text-center relative">
        {authUser && (
            <div className="absolute right-0 top-0 flex items-center gap-4">
                <span className="text-sm font-medium text-zinc-600">Hi, {authUser.username}</span>
                <button 
                    onClick={logout}
                    className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex items-center gap-2"
                    title="Logout"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="hidden sm:inline text-sm font-medium">Logout</span>
                </button>
            </div>
        )}
        <h1 className="text-5xl font-bold text-transparent bg-primary bg-clip-text">
            TodoX for LocMixi
        </h1>
        
        <p className="text-muted-foreground">
            ⚡ Không chờ cơ hội 🌊 tự tạo sóng để vươn lên!
        </p>
    </div>
    );
    
};

export default Header;