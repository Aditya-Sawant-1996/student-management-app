import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Student, StudentService } from '../../features/student/student.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-add-edit-student-modal',
  templateUrl: './add-edit-student-modal.component.html',
  styleUrls: ['./add-edit-student-modal.component.scss']
})
export class AddEditStudentModalComponent implements OnInit, OnDestroy {

  student: Student | null = null;

  form: FormGroup;
  submitted = false;
  loading = false;
  selectedPhoto: File | null = null;
  photoError: string | null = null;
  photoPreviewUrl: string | null = null;

  genders: { name: string; value: Student['gender'] }[] = [
    { name: 'Male', value: 'Male' },
    { name: 'Female', value: 'Female' },
    { name: 'Other', value: 'Other' },
  ];

  handicappedOptions: { label: string; value: Student['handicapped'] }[] = [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' },
  ];

  allSubjects: string[] = [
    'Mathematics',
    'Science',
    'English',
    'History',
    'Geography',
    'Computer Science',
  ];
  subjectSearch = '';

  get isEdit(): boolean {
    return !!(this.student && this.student._id);
  }

  constructor(
    private fb: FormBuilder,
    private studentService: StudentService,
    @Inject(MAT_DIALOG_DATA) public data: { student: Student | null },
    private dialogRef: MatDialogRef<AddEditStudentModalComponent>
  ) {
    this.student = data?.student ?? null;

    const namePattern = /^[A-Za-z\s]+$/;
    const aadhaarPattern = /^\d{12}$/;
    const mobilePattern = /^\d{10}$/;

    this.form = this.fb.group({
      surName: ['', [Validators.required, Validators.pattern(namePattern)]],
      firstName: ['', [Validators.required, Validators.pattern(namePattern)]],
      guardianName: ['', [Validators.required, Validators.pattern(namePattern)]],
      mothersName: ['', [Validators.required, Validators.pattern(namePattern)]],
      subject: [[], [Validators.required]],
      batch: [''],
      address: ['', [Validators.required]],
      aadhaarNumber: ['', [Validators.required, Validators.pattern(aadhaarPattern)]],
      mobileNo: ['', [Validators.required, Validators.pattern(mobilePattern)]],
      email: ['', [Validators.email]],
      birthPlace: ['', [Validators.required]],
      dateOfBirth: [null, [Validators.required]],
      gender: ['', [Validators.required]],
      handicapped: ['', [Validators.required]],
      latestEducation: ['', [Validators.required]],
      previousSchoolName: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.submitted = false;
    if (this.student) {
      this.form.reset({
        surName: this.student.surName ?? '',
        firstName: this.student.firstName ?? '',
        guardianName: this.student.guardianName ?? '',
        mothersName: this.student.mothersName ?? '',
        subject: this.student.subject ?? [],
        batch: this.student.batch ?? '',
        address: this.student.address ?? '',
        aadhaarNumber: this.student.aadhaarNumber ?? '',
        mobileNo: this.student.mobileNo ?? '',
        email: this.student.email ?? '',
        birthPlace: this.student.birthPlace ?? '',
        dateOfBirth: this.student.dateOfBirth
          ? new Date(this.student.dateOfBirth)
          : null,
        gender: this.student.gender ?? '',
        handicapped: this.student.handicapped ?? '',
        latestEducation: this.student.latestEducation ?? '',
        previousSchoolName: this.student.previousSchoolName ?? '',
      });

      if (this.student.photo) {
        this.photoPreviewUrl = this.buildPhotoUrl(this.student.photo);
      }
    } else {
      this.form.reset({
        surName: '',
        firstName: '',
        guardianName: '',
        mothersName: '',
        subject: [],
        batch: '',
        address: '',
        aadhaarNumber: '',
        mobileNo: '',
        email: '',
        birthPlace: '',
        dateOfBirth: null,
        gender: '',
        handicapped: '',
        latestEducation: '',
        previousSchoolName: '',
      });
    }
  }

  ngOnDestroy(): void {
    this.clearPreview();
  }

  onClose(): void {
  this.dialogRef.close(false);
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.isEdit && !this.selectedPhoto) {
      this.photoError = 'Photo is required.';
      return;
    }

    const formValue = this.form.value;

    const payload = new FormData();
    Object.keys(formValue).forEach((key) => {
      const value = (formValue as any)[key];
      if (value === null || value === undefined || value === '') {
        return;
      }
      if (key === 'subject' && Array.isArray(value)) {
        value.forEach((s: string) => payload.append('subject', s));
        return;
      }
      if (key === 'dateOfBirth') {
        const date: Date = value instanceof Date ? value : new Date(value);
        payload.append('dateOfBirth', date.toISOString());
        return;
      }
      payload.append(key, value);
    });

    if (this.selectedPhoto) {
      payload.append('photo', this.selectedPhoto);
    }

    this.loading = true;

    if (this.isEdit && this.student && this.student._id) {
      this.studentService.update(this.student._id, payload).subscribe({
        next: () => {
          this.loading = false;
          this.submitted = false;
          this.form.reset();
          this.dialogRef.close(true);
        },
        error: () => {
          this.loading = false;
        },
      });
    } else {
      this.studentService.create(payload).subscribe({
        next: () => {
          this.loading = false;
          this.submitted = false;
          this.form.reset();
          this.dialogRef.close(true);
        },
        error: () => {
          this.loading = false;
        },
      });
    }
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    this.handleFile(input.files[0]);
    // clear value so selecting same file again still triggers change
    input.value = '';
  }

  onPhotoDrop(event: DragEvent): void {
    event.preventDefault();
    if (!event.dataTransfer || !event.dataTransfer.files.length) {
      return;
    }
    if (event.dataTransfer.files.length > 1) {
      this.photoError = 'Please upload only one image.';
      this.selectedPhoto = null;
      this.clearPreview();
      return;
    }
    this.handleFile(event.dataTransfer.files[0]);
  }

  onPhotoDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private handleFile(file: File): void {
    this.photoError = null;
    if (!file.type.startsWith('image/')) {
      this.photoError = 'Only image files are allowed.';
      this.selectedPhoto = null;
      this.clearPreview();
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.photoError = 'File size must be 5MB or less.';
      this.selectedPhoto = null;
      this.clearPreview();
      return;
    }
    this.clearPreview();
    this.selectedPhoto = file;
    this.photoPreviewUrl = URL.createObjectURL(file);
  }

  private clearPreview(): void {
    if (this.photoPreviewUrl && this.photoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.photoPreviewUrl);
    }
    this.photoPreviewUrl = null;
  }

  private buildPhotoUrl(path: string): string {
    if (!path) {
      return '';
    }
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const base = 'http://localhost:3000';
    return base + (path.startsWith('/') ? path : '/' + path);
  }

  get filteredSubjects(): string[] {
    const search = this.subjectSearch.toLowerCase();
    return this.allSubjects.filter((s) => s.toLowerCase().includes(search));
  }

}
