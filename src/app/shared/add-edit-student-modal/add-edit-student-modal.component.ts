import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SelectedSubject, Student, StudentService } from '../../features/student/student.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SubjectModel, SubjectService } from '../../features/subject/subject.service';

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

  subjects: SubjectModel[] = [];
  subjectSearch = '';

  get isEdit(): boolean {
    return !!(this.student && this.student._id);
  }

  constructor(
    private fb: FormBuilder,
    private studentService: StudentService,
    private subjectService: SubjectService,
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
      mothersName: ['', [Validators.pattern(namePattern)]],
      subject: [[], [Validators.required]],
      batch: [''],
      address: [''],
      aadhaarNumber: ['', [Validators.pattern(aadhaarPattern)]],
      mobileNo: ['', [Validators.required, Validators.pattern(mobilePattern)]],
      email: ['', [Validators.email]],
      birthPlace: [''],
      dateOfBirth: [null],
      gender: [''],
      handicapped: [''],
      latestEducation: [''],
      previousSchoolName: [''],
    });
  }

  ngOnInit(): void {
    this.submitted = false;
		this.loadSubjects();
    if (this.student) {
      this.form.reset({
        surName: this.student.surName ?? '',
        firstName: this.student.firstName ?? '',
        guardianName: this.student.guardianName ?? '',
        mothersName: this.student.mothersName ?? '',
			subject: [],
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

		const selectedSubjectIds: string[] = Array.isArray(formValue.subject)
			? formValue.subject
			: [];
		const selectedSubjectsFull: SubjectModel[] = this.subjects.filter(
			(s) => s._id && selectedSubjectIds.includes(s._id),
		);
		const selectedSubjectsForSave: SelectedSubject[] = selectedSubjectsFull.map(
			(s) => ({ _id: s._id as string, name: s.subjectName }),
		);
		const selectedSubjectNames = selectedSubjectsForSave.map((s) => s.name);

    const payload = new FormData();
    Object.keys(formValue).forEach((key) => {
      const value = (formValue as any)[key];
      if (value === null || value === undefined || value === '') {
        return;
      }
      if (key === 'subject') {
			// handled separately below
			return;
		}
      if (key === 'dateOfBirth') {
        const date: Date = value instanceof Date ? value : new Date(value);
        payload.append('dateOfBirth', date.toISOString());
        return;
      }
      payload.append(key, value);
    });

		// send legacy subject names for compatibility
		selectedSubjectNames.forEach((name) => payload.append('subject', name));
		// send selectedSubjects array as JSON string for backend parsing
		if (selectedSubjectsForSave.length) {
			payload.append(
				'selectedSubjects',
				JSON.stringify(selectedSubjectsForSave),
			);
		}

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

  private loadSubjects(): void {
    this.subjectService.list(1, 1000, '').subscribe({
      next: (res) => {
        this.subjects = res.data || [];
        if (this.student) {
          this.preselectSubjects();
        }
      },
      error: () => {
        this.subjects = [];
      },
    });
  }

  private preselectSubjects(): void {
    if (!this.student) {
      return;
    }
    const control = this.form.get('subject');
    if (!control) {
      return;
    }
    let selectedIds: string[] = [];

    const selectedSubjects =
      (this.student as any).selectedSubjects as SelectedSubject[] | undefined;
    if (selectedSubjects && selectedSubjects.length) {
      selectedIds = selectedSubjects
        .map((s) => s._id)
        .filter((id): id is string => !!id);
    } else if (this.student.subject && this.student.subject.length) {
      selectedIds = this.subjects
        .filter((s) => this.student!.subject.includes(s.subjectName))
        .map((s) => s._id as string)
        .filter((id): id is string => !!id);
    }

    control.setValue(selectedIds);
  }

  get filteredSubjects(): SubjectModel[] {
    const search = this.subjectSearch.toLowerCase();
    return this.subjects.filter((s) =>
      s.subjectName.toLowerCase().includes(search),
    );
  }

}
