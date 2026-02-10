import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Student, StudentService } from '../../features/student/student.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-add-edit-student-modal',
  templateUrl: './add-edit-student-modal.component.html',
  styleUrls: ['./add-edit-student-modal.component.scss']
})
export class AddEditStudentModalComponent implements OnInit {

  student: Student | null = null;

  form: FormGroup;
  submitted = false;
  loading = false;

  genders: any[] = [ {name:"Male", value:'male'}, {name:"Female", value:'female'}, {name:"Other", value:'other'}];
  readonly bloodGroups: string[] = [
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
    'O+',
    'O-',
  ];
  readonly nationalities: string[] = ['Indian', 'Other'];

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
	this.form = this.fb.group({
    firstName: ['', Validators.required],
    middleName: [''],
    lastName: ['', Validators.required],
    fullNameMarathi: [''],
    gender: ['', Validators.required],
    dateOfBirth: [null, Validators.required],
    age: [null, [Validators.required, Validators.min(1)]],
    bloodGroup: [''],
    nationality: ['Indian'],
    class: ['', Validators.required],
  });

  this.form.get('dateOfBirth')?.valueChanges.subscribe((value) => {
    const age = this.calculateAge(value);
    if (age !== null) {
      this.form.get('age')?.setValue(age, { emitEvent: false });
    } else {
      this.form.get('age')?.setValue(null, { emitEvent: false });
    }
  });
  }

  ngOnInit(): void {
  this.submitted = false;
  if (this.student) {
    const parsed = this.parseNameFromLegacy(this.student);
    this.form.reset({
    firstName: this.student.firstName ?? parsed.firstName,
    middleName: this.student.middleName ?? parsed.middleName,
    lastName: this.student.lastName ?? parsed.lastName,
    fullNameMarathi: this.student.fullNameMarathi ?? '',
    gender: this.student.gender ?? '',
    dateOfBirth: this.student.dateOfBirth
      ? new Date(this.student.dateOfBirth)
      : null,
    age: this.student.age,
    bloodGroup: this.student.bloodGroup ?? '',
    nationality: this.student.nationality ?? 'Indian',
    class: this.student.class,
    });
  } else {
    this.form.reset({
    firstName: '',
    middleName: '',
    lastName: '',
    fullNameMarathi: '',
    gender: '',
    dateOfBirth: null,
    age: null,
    bloodGroup: '',
    nationality: 'Indian',
    class: '',
    });
  }
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

    const formValue = this.form.value;
    const payload: Student = {
      ...formValue,
      // ensure dateOfBirth is sent as ISO string
      dateOfBirth: formValue.dateOfBirth
        ? (formValue.dateOfBirth instanceof Date
          ? formValue.dateOfBirth.toISOString()
          : new Date(formValue.dateOfBirth).toISOString())
        : undefined,
    } as Student;
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

  private calculateAge(value: any): number | null {
    if (!value) {
      return null;
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  }

  private parseNameFromLegacy(student: Student): {
    firstName: string;
    middleName: string;
    lastName: string;
  } {
    const legacyName = student.name ?? '';
    const parts = legacyName.trim().split(/\s+/).filter(Boolean);
    let firstName = '';
    let middleName = '';
    let lastName = '';
    if (parts.length === 1) {
      firstName = parts[0];
    } else if (parts.length === 2) {
      [firstName, lastName] = parts;
    } else if (parts.length >= 3) {
      firstName = parts[0];
      lastName = parts[parts.length - 1];
      middleName = parts.slice(1, parts.length - 1).join(' ');
    }
    return { firstName, middleName, lastName };
  }

}
