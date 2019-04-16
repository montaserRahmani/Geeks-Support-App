import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule, MatButtonModule, MatCheckboxModule,
   MatInputModule, MatSnackBarModule, MatProgressSpinnerModule,
    MatProgressBarModule, MatFormFieldModule } from '@angular/material';

@NgModule({
  imports: [
            MatIconModule,
            MatButtonModule,
            MatCheckboxModule,
            MatInputModule,
            MatSnackBarModule,
            MatProgressSpinnerModule,
            MatProgressBarModule,
            MatFormFieldModule,
            ReactiveFormsModule
          ],
  exports: [
            MatIconModule,
            MatButtonModule,
            MatCheckboxModule,
            MatInputModule,
            MatSnackBarModule,
            MatProgressSpinnerModule,
            MatProgressBarModule,
            MatFormFieldModule,
            ReactiveFormsModule
          ],
})
export class MaterialsModule { }