import { Injectable, Injector } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

type ToastLevel = 'success' | 'error' | 'warning' | 'info';

@Injectable({
  providedIn: 'root'
})
export class SafeToastrService {
  private injector: Injector;

  constructor(injector: Injector) {
    this.injector = injector;
  }

  success(message: string, title?: string): void {
    this.show('success', message, title);
  }

  error(message: string, title?: string): void {
    this.show('error', message, title);
  }

  warning(message: string, title?: string): void {
    this.show('warning', message, title);
  }

  info(message: string, title?: string): void {
    this.show('info', message, title);
  }

  private show(level: ToastLevel, message: string, title?: string): void {
    const toastr = this.getToastr();
    if (!toastr) return;

    toastr[level](message, title);
  }

  private getToastr(): ToastrService | null {
    try {
      return this.injector.get(ToastrService);
    } catch {
      return null;
    }
  }
}
