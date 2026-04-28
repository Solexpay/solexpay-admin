import { Directive, ElementRef, Renderer2, Input, inject, OnInit } from '@angular/core';
import { ToastService } from '../services/toast.service';

@Directive({
  selector: '[copyToClipboard]',
  standalone: true,
})
export class CopyToClipboardDirective implements OnInit {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private toast = inject(ToastService);

  @Input('copyToClipboard') customText: string | null = null;

  private isCopied = false;

  ngOnInit() {
    const element = this.el.nativeElement;
    this.renderer.setStyle(element, 'cursor', 'pointer');
    
    this.renderer.listen(element, 'click', (event: MouseEvent) => {
      event.stopPropagation(); // Prevent trigger parent click events (like accordion toggle)
      const textToCopy = this.customText || element.textContent?.trim() || '';
      if (textToCopy) {
        this.copyToClipboard(textToCopy);
      }
    });
  }

  private async copyToClipboard(text: string) {
    if (this.isCopied) return;
    
    try {
      await navigator.clipboard.writeText(text);
      this.isCopied = true;
      
      // Visual feedback
      const element = this.el.nativeElement;
      element.classList.add('animate-copy-feedback');
      
      // Show toast
      this.toast.show('success', 'Copied to clipboard!');
      
      setTimeout(() => {
        element.classList.remove('animate-copy-feedback');
        this.isCopied = false;
      }, 300);
    } catch (err) {
      this.toast.show('error', 'Failed to copy');
    }
  }
}
