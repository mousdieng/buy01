import {Component, EventEmitter, Input, Output, OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {MenuModule} from 'primeng/menu';
import {ACTION, Media, ProductWithMedia, ToastMessage} from "../../types";
import {UploadImagesComponent} from "../upload-images/upload-images.component";
import {MediaService} from "../../services/media/media.service";
import {catchError, finalize} from "rxjs/operators";
import {of} from "rxjs";
import {MessageService} from "primeng/api";
import {ToastModule} from "primeng/toast";
import {DialogModule} from "primeng/dialog";
import {ModalComponent} from "../modal/modal.component";

@Component({
  selector: 'app-media-layout',
  standalone: true,
  imports: [CommonModule, ModalComponent, MenuModule, ButtonModule, UploadImagesComponent, ToastModule, DialogModule],
  templateUrl: './media-layout.component.html',
  styleUrls: ['./media-layout.component.css']
})
export class MediaLayoutComponent implements OnDestroy {
  @Input() productMedia!: ProductWithMedia;
  @Input() media!: Media;
  @Input({required: true}) action: ACTION = ACTION.CREATE;
  @Output() isComplete = new EventEmitter<ToastMessage>();
  
  isVisible: boolean = false;
  ACTION = ACTION;
  isLoading: boolean = false;
  deleteError: string = '';
  
  constructor(private mediaService: MediaService, private messageService: MessageService) {}
  
  ngOnDestroy(): void {
    // Ensure we clean up body class when component is destroyed
    this.ensureScrollingRestored();
  }
  
  deleteMedia(): void {
    if (this.isLoading) return;
    this.isLoading = true;
    this.deleteError = '';
    
    this.mediaService.deleteMedia(this.media.id).pipe(
      catchError((error) => {
        console.error('Delete media failed:', error);
        this.deleteError = error?.error?.message || "Failed to delete the image. Please try again.";
        this.isComplete.emit({
          severity: 'error',
          summary: 'Error Deleting Image',
          detail: this.deleteError,
          status: "FAILED"
        });
        return of(null);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe((response) => {
      if (response) {
        this.toggle(false);
        this.isComplete.emit({
          severity: 'success',
          summary: 'Image Deleted',
          detail: response?.message || 'Image successfully deleted!',
          status: "OK"
        });
      }
    });
  }
  
  toggle(value?: boolean): void {
    if (this.isLoading) return;
    
    this.isVisible = value !== undefined ? value : !this.isVisible;
    this.deleteError = '';
    
    if (this.isVisible) {
      this.disableBodyScrolling();
    } else {
      this.ensureScrollingRestored();
    }
  }
  
  private disableBodyScrolling(): void {
    // Save current scroll position before disabling scrolling
    const scrollY = window.scrollY;
    document.body.style.top = `-${scrollY}px`;
    document.body.classList.add('overflow-hidden');
    document.body.dataset['scrollPosition'] = scrollY.toString();
  }
  
  private ensureScrollingRestored(): void {
    if (document.body.classList.contains('overflow-hidden')) {
      document.body.classList.remove('overflow-hidden');
      
      // Restore scroll position
      const scrollY = document.body.dataset['scrollPosition'] || '0';
      window.scrollTo(0, parseInt(scrollY));
      document.body.style.top = '';
      delete document.body.dataset['scrollPosition'];
    }
  }
  
  handleEvent(event: ToastMessage): void {
    if (event.status === "OK") {
      this.toggle(false); // Explicitly close the modal
      this.isComplete.emit(event);
      return;
    }
    this.messageService.add(event);
  }
  
  getDialogHeader(): string {
    switch (this.action) {
      case ACTION.CREATE:
        return 'Upload Images';
      case ACTION.UPDATE:
        return 'Edit Image';
      case ACTION.DELETE:
        return 'Delete Image';
      default:
        return 'Manage Images';
    }
  }
  
  getImageCount(): number {
    return this.productMedia?.media?.length || 0;
  }
}