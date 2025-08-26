import {PaginatedResponse} from "../types";

export const defaultPaginatedResponse = <T>(): PaginatedResponse<T> => ({
    content: [],
    empty: true,
    first: true,
    last: true,
    number: 0,
    numberOfElements: 0,
    pageable: {
        pageNumber: 0,
        pageSize: 0,
        offset: 0,
        paged: false,
        unpaged: true,
    },
    size: 0,
    length: 0,
    totalElements: 0,
    totalPages: 0
});
