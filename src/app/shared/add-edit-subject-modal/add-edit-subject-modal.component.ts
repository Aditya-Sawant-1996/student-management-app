import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SubjectModel, SubjectService } from '../../features/subject/subject.service';

@Component({
  selector: 'app-add-edit-subject-modal',
  templateUrl: './add-edit-subject-modal.component.html',
  styleUrls: ['./add-edit-subject-modal.component.scss']
})
export class AddEditSubjectModalComponent {
  subject: SubjectModel | null = null;
  form: FormGroup;
  submitted = false;
  loading = false;
  errorMessage: string | null = null;

  get isEdit(): boolean {
    return !!(this.subject && this.subject._id);
  }

  constructor(
    private fb: FormBuilder,
    private subjectService: SubjectService,
    @Inject(MAT_DIALOG_DATA) public data: { subject: SubjectModel | null },
    private dialogRef: MatDialogRef<AddEditSubjectModalComponent>
  ) {
    this.subject = data?.subject ?? null;

    this.form = this.fb.group({
      subjectName: [this.subject?.subjectName ?? '', [Validators.required]],
    });
  }

  onClose(): void {
    this.dialogRef.close(false);
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value as { subjectName: string };
    this.loading = true;

    if (this.isEdit && this.subject && this.subject._id) {
      this.subjectService.update(this.subject._id, value).subscribe({
        next: () => {
          this.loading = false;
          this.submitted = false;
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.error?.message || 'Failed to update subject.';
        },
      });
    } else {
      this.subjectService.create(value).subscribe({
        next: () => {
          this.loading = false;
          this.submitted = false;
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.error?.message || 'Failed to create subject.';
        },
      });
    }
  }
}
