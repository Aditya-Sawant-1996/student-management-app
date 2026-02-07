import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Student, StudentService } from './student.service';

@Component({
  selector: 'app-student-list',
  templateUrl: './student-list.component.html',
})
export class StudentListComponent implements OnInit {
  students: Student[] = [];
  search = '';
  page = 1;
  limit = 5;
  total = 0;

  form!: FormGroup;
  editingId: string | null = null;
  loading = false;

  constructor(private studentService: StudentService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      age: [null, [Validators.required, Validators.min(1)]],
      class: ['', Validators.required],
    });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.studentService.list(this.page, this.limit, this.search).subscribe({
      next: (res) => {
        if (res.success) {
          this.students = res.data;
          this.total = res.total;
          this.page = res.page;
          this.limit = res.limit;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onSearchChange(value: string): void {
    this.search = value;
    this.page = 1;
    this.load();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }
    const payload = this.form.value as Student;

    if (this.editingId) {
      this.studentService.update(this.editingId, payload).subscribe(() => {
        this.editingId = null;
        this.form.reset();
        this.load();
      });
    } else {
      this.studentService.create(payload).subscribe(() => {
        this.form.reset();
        this.load();
      });
    }
  }

  edit(student: Student): void {
    this.editingId = student._id ?? null;
    this.form.patchValue({
      name: student.name,
      age: student.age,
      class: student.class,
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form.reset();
  }

  delete(student: Student): void {
    if (!student._id) {
      return;
    }
    if (!confirm('Delete this student?')) {
      return;
    }
    this.studentService.delete(student._id).subscribe(() => {
      this.load();
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.limit));
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.load();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.load();
    }
  }
}
