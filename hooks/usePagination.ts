import { useState, useCallback } from "react";

export interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  totalItems?: number;
}

export function usePagination(options: UsePaginationOptions = {}) {
  const [currentPage, setCurrentPage] = useState(options.initialPage || 1);
  const [pageSize, setPageSize] = useState(options.initialPageSize || 10);

  const setPage = useCallback((page: number, totalPages?: number) => {
    if (page < 1) return;
    if (totalPages && page > totalPages) return;
    setCurrentPage(page);
  }, []);

  const nextPage = useCallback((totalPages?: number) => {
    setCurrentPage((prev) => {
      if (totalPages && prev >= totalPages) return prev;
      return prev + 1;
    });
  }, []);

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => {
      if (prev <= 1) return prev;
      return prev - 1;
    });
  }, []);

  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1); 
  }, []);

  return {
    currentPage,
    pageSize,
    setPage,
    nextPage,
    prevPage,
    changePageSize,
  };
}
