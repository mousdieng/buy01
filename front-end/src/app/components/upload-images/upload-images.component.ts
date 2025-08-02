import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MessageService} from "primeng/api";
import {CommonModule} from "@angular/common";
import {FileSelectEvent, FileUploadEvent, FileUploadModule} from 'primeng/fileupload';
import {MediaService} from "../../services/media/media.service";
import {catchError, finalize} from 'rxjs/operators';
import {of} from 'rxjs';
import {ACTION, Media, ProductWithMedia, ToastMessage} from "../../types";

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface UploadEvent {
    originalEvent: Event;
    files: File[];
}

interface ValidationResult {
    isValid: boolean;
    message?: string;
}

@Component({
    selector: 'app-upload-images',
    imports: [FileUploadModule, CommonModule],
    standalone: true,
    templateUrl: './upload-images.component.html',
    styleUrls: ['./upload-images.component.css'],
    providers: [MessageService]
})
export class UploadImagesComponent implements OnInit {
    @Input({required: true}) action: ACTION = ACTION.CREATE;
    @Input() productMedia!: ProductWithMedia;
    @Input() mediaToUpdate: Media | null = null;
    @Output() event = new EventEmitter<ToastMessage>()
    lastMessageError: ToastMessage | null = null;

    uploadedFiles: File[] = [];
    isUploading = false;
    remainingSlots = MAX_FILES;

    constructor(
        private mediaService: MediaService
    ) {}

    ngOnInit() {
        this.updateRemainingSlots();
    }

    private updateRemainingSlots(): void {
        if (this.action != ACTION.CREATE) return;
        this.remainingSlots = MAX_FILES - (this.productMedia.media.length + this.uploadedFiles.length);
    }

    private validateFiles(files: File[]): ValidationResult {
        if (files.length > this.remainingSlots && this.action == ACTION.CREATE) {
            return {
                isValid: false,
                message: `Cannot upload more than ${MAX_FILES} files in total. ${this.remainingSlots} slots remaining.`
            };
        }

        for (const file of files) {
            if (file.size > MAX_FILE_SIZE_BYTES) {
                return {
                    isValid: false,
                    message: `File "${file.name}" exceeds maximum size of ${MAX_FILE_SIZE_MB}MB`
                };
            }

            if (!ALLOWED_FILE_TYPES.includes(file.type)) {
                return {
                    isValid: false,
                    message: `File "${file.name}" has unsupported type. Allowed types: JPG, PNG, WebP`
                };
            }
        }

        return { isValid: true };
    }

    onSelect(event: FileSelectEvent) {
        const validation = this.validateFiles(event.files);

        if (!validation.isValid) {
            let message: ToastMessage = {
                severity: 'error',
                summary: 'Validation Error',
                detail: validation.message || "",
                status: "FAILED"
            }
            this.event.emit(message)
            this.lastMessageError = message;
            return;
        }

        this.uploadedFiles.push(...event.files);
        this.updateRemainingSlots();

        this.event.emit({
            severity: 'info',
            summary: 'Files Selected',
            detail: `${event.files.length} file(s) ready for upload. Click upload to proceed.`,
            status: "-"
        })
    }

    onRemove(event: { file: File }) {
        this.uploadedFiles = this.uploadedFiles.filter(file => file !== event.file);
        this.updateRemainingSlots();
    }

    onSubmit(event: FileUploadEvent) {
        if (this.lastMessageError){
            this.event.emit(this.lastMessageError)
            return;
        }

        if (!this.uploadedFiles.length) {
            this.event.emit({
                severity: 'warn',
                summary: 'No Files',
                detail: 'Please select at least one file before submitting.',
                status: "FAILED"
            })
            return;
        }

        this.isUploading = true;
        const formData = new FormData();
        this.uploadedFiles.forEach(file => formData.append("files", file));

        if (this.action == ACTION.UPDATE) this.update(formData)
        else this.create(formData)
    }

    create(formData: FormData) {

        this.mediaService.createMedia(this.productMedia.product.id, formData).pipe(
            catchError((error) => {
                this.event.emit({
                    severity: 'error',
                    summary: 'Upload Failed',
                    detail: error?.error?.message || 'Upload Failed',
                    status: "FAILED"
                })
                return of(error);
            }),
            finalize(() => {
                this.isUploading = false;
            })
        ).subscribe((response) => {
            this.uploadedFiles = [];
            this.updateRemainingSlots();
            this.event.emit({
                severity: 'success',
                summary: 'Success',
                detail: response?.message || 'Files successfully uploaded!',
                status: "OK"
            })

        });
    }

    update(formData: FormData) {
        console.log(formData)
        if (!this.mediaToUpdate) {
            this.event.emit({
                severity: 'warn',
                summary: 'Invalid',
                detail: 'Provide the media to update first!',
                status: "FAILED"
            })
            return;
        }

        this.mediaService.updateMedia(this.mediaToUpdate.id, formData).pipe(
            catchError((error) => {
                console.log("helo", error)
                this.event.emit({
                    severity: 'error',
                    summary: 'Update Failed',
                    detail: error?.error?.message || "Failed to update the media.",
                    status: "FAILED"
                })
                return of();
            }),
            finalize(() => {
                this.isUploading = false;
            })
        ).subscribe((response) => {
            this.uploadedFiles = [];
            this.updateRemainingSlots();
            this.event.emit({
                severity: 'success',
                summary: 'Success',
                detail: response?.message || 'Media successfully updated!',
                status: "OK"
            })
            return;
        });
    }

}