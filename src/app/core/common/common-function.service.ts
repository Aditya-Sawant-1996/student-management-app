import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

export type ToastType = 'success' | 'error';

@Injectable({ providedIn: 'root' })
export class CommonFunctionService {
  constructor(private snackBar: MatSnackBar) {}

  showToast(message: string, type: ToastType = 'success'): void {
    this.snackBar.open(message, 'OK', {
      duration: 4000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: type === 'success' ? ['toast-success'] : ['toast-error'],
    });
  }
}
