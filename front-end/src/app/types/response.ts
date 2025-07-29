
export interface PaginatedResponse<T> {
    content: T[]; // The actual list of items
    page: {
        totalPages: number; // Total number of pages
        totalElements: number; // Total number of elements
        size: number; // Number of items in the current page
        number: number; // Current page index
    }
}

export type ApiResponse<T>  = {
    status: number | null,
    message: string,
    data: T
}
