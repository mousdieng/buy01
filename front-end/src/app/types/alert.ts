import {AlertVariant} from "./enum";

export interface Alert {
    variant: AlertVariant;
    title: string;
    message: string | string[];
}

export interface ToastMessage {
    severity: string,
    summary: string,
    detail: string,
    status: "OK" | "FAILED" | "-"
}