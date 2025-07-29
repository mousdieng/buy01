
export interface User {
    id: string
    name: string
    email: string
    role: 'CLIENT' | 'SELLER'
    avatar: string | null
}

export interface UserPayload {
    id: string
    name: string
    email: string
    role: 'CLIENT' | 'SELLER' | null
    avatar: string | null
    isAuthenticated: boolean
}

export interface UserLoginRequest {
    email: string | null | undefined
    password: string | null | undefined
}