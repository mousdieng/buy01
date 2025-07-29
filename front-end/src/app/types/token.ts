import {User} from "./user";

export type Tokens = {
    accessToken: string,
    refreshToken: string
}

export type TokenPayload = {
    exp: number,
    iat: number,
    iss: string,
    sub: string,
    user: User
}