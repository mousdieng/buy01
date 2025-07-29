
export enum Role{CLIENT = 'CLIENT', SELLER = 'SELLER'}
export enum ACTION{CREATE = "CREATE", UPDATE = "UPDATE", DELETE = "DELETE"}
export enum AlertVariant {
    Error = "error",
    Info = "info",
    Success = "success",
    Warning = "warning"
}

export enum OrderStatus {
    PENDING = "PENDING",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED",
}

export enum PaymentStatus {
    INCOMPLETE = "INCOMPLETE",
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED",
    REFUNDED = "REFUNDED",
    EXPIRED = "EXPIRED"
}