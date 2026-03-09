import React from "react";
import { cn } from "@/lib/utils";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

const TaskListPagination = ({ 
    handleNext, 
    handlePrev, 
    handlePageChange,
    page,
    totalPages
}) => {

    const generatePages = () => {
        const pages = [];

        if(totalPages < 4) {
            // hiện toàn bộ số trang
            for(let i = 1; i <= totalPages;i++) 
                pages.push(i);          
        }
        else {
            if(page < 2) {
                pages.push(1,2,3,"...", totalPages);
            }
            else if (page >= totalPages - 1) {
                pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);

            }
            else {
                pages.push(1, "...", page, "...", totalPages);
            }
        }

        return pages;
    };

    const pagesToShow = generatePages();

    return (
        <div className="flex justify-center mt-4">
            <Pagination>
                <PaginationContent>
                    {/* Trang trước */}
                    <PaginationItem>
                        <PaginationPrevious
                            onClick={() => {
                                if (page > 1) handlePrev();
                            }}
                            className={cn(
                                page === 1
                                ? "pointer-events-none opacity-40"
                                : "cursor-pointer"
                            )}
                        />
                    </PaginationItem>

                    {pagesToShow.map((p, index) => (
                        <PaginationItem
                            key = {index}
                        >
                            {p === "..." ? (
                                <PaginationEllipsis />
                            ) : (
                                <PaginationLink
                                    isActive = {p === page}
                                    onClick={() => {
                                        if (p != page) handlePageChange(p);
                                    }}
                                    className="cusors-pointer"
                                >
                                    {p}

                                </PaginationLink>
                            )}
                            
                        </PaginationItem>
                    ))}

                    {/* Trang sau */}
                    <PaginationItem>

                        <PaginationNext
                            onClick={() => {
                                if (page < totalPages) handleNext();
                            }}
                            className={cn(
                                page === totalPages
                                ? "pointer-events-none opacity-40"
                                : "cursor-pointer"
                            )}
                        />

                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    )
}

            
        

export default TaskListPagination;