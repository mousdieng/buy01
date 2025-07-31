
export interface PaginatedResponse<T> {
    content: T[]
    empty: boolean
    first: boolean
    last: boolean
    number: number
    numberOfElements: number
    pageable: {
        pageNumber: number,
        pageSize: number,
        offset: number,
        paged: boolean
        unpaged: boolean
    }
    size: number
    length: number
    totalElements: number
    totalPages: number
}

export type ApiResponse<T>  = {
    status: number | null,
    message: string,
    data: T
}
