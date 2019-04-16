import { Injectable } from "@angular/core";
import {MatSnackBar, MatSnackBarRef, SimpleSnackBar} from '@angular/material';

@Injectable()
export class ToastService {
  toast: MatSnackBarRef<SimpleSnackBar>;

  constructor(private snackBar: MatSnackBar) { }

  present(message: string, options?: any) {
    this.toast = this.snackBar.open(message, 'Close' ,{
      duration: 3000,
      ...options
    });
  }

  dismiss() {
    return this.toast.dismiss();
  }
}