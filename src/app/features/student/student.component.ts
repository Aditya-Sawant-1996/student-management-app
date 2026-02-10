import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Student, StudentService } from './student.service';
import { AddEditStudentModalComponent } from '../../shared/add-edit-student-modal/add-edit-student-modal.component';

@Component({
  selector: 'app-student',
  templateUrl: './student.component.html'
})
export class StudentComponent implements OnInit {

  students: Student[] = [];
  search = '';
  page = 1;
  limit = 5;
  total = 0;
  loading = false;

  tableHeaders = [
    { field: 'name', label: 'Name' },
    { field: 'age', label: 'Age' },
    { field: 'class', label: 'Class' },
  ];

  searchPlaceholder = 'Search by name or class...';

  constructor(private studentService: StudentService, private dialog: MatDialog) {}

  ngOnInit(): void {
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

  openAddModal(): void {
  const dialogRef = this.dialog.open(AddEditStudentModalComponent, {
    // width: '640px',
    data: { student: null },
    panelClass: 'student-dialog-panel',
  });
  dialogRef.afterClosed().subscribe((result) => {
    if (result) {
      this.load();
    }
  });
  }

  openEditModal(student: Student): void {
  const dialogRef = this.dialog.open(AddEditStudentModalComponent, {
    // width: '640px',
    data: { student },
    panelClass: 'student-dialog-panel',
  });
  dialogRef.afterClosed().subscribe((result) => {
    if (result) {
      this.load();
    }
  });
  }

  onDelete(student: Student): void {
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
