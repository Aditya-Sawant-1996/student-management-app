import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface DeleteConfirmDialogData {
  message: string;
}

@Component({
  selector: 'app-delete-confirm-modal',
  templateUrl: './delete-confirm-modal.component.html',
  styleUrls: ['./delete-confirm-modal.component.scss']
})
export class DeleteConfirmModalComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DeleteConfirmDialogData,
    private dialogRef: MatDialogRef<DeleteConfirmModalComponent>,
  ) {}

  get message(): string {
    return this.data?.message || 'Are you sure you want to delete this item?';
  }

  onNo(): void {
    this.dialogRef.close(false);
  }

  onYes(): void {
    this.dialogRef.close(true);
  }
}
