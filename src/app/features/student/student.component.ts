import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Student, StudentService } from './student.service';
import { AddEditStudentModalComponent } from '../../shared/add-edit-student-modal/add-edit-student-modal.component';
import { DeleteConfirmModalComponent } from '../../shared/delete-confirm-modal/delete-confirm-modal.component';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { CommonFunctionService } from '../../core/common/common-function.service';

@Component({
  selector: 'app-student',
  templateUrl: './student.component.html',
})
export class StudentComponent implements OnInit, OnDestroy {
  students: Student[] = [];
  search = '';
  page = 1;
  limit = 10;
  total = 0;
  loading = false;
  pageSizeOptions: number[] = [10, 20, 30, 100];
  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  tableHeaders = [
    { field: 'displayName', label: 'Name' },
    { field: 'mobileNo', label: 'Mobile' },
		{ field: 'displaySubjects', label: 'Subjects', tooltipField: 'subjectsTooltip' },
		{ field: 'totalFees', label: 'Total Fees' },
		{ field: 'totalFeesPaid', label: 'Fees Paid' },
		{ field: 'pendingFees', label: 'Pending Fees' },
  ];

  searchPlaceholder = 'Search by name, mobile...';

  constructor(
    private studentService: StudentService,
    private dialog: MatDialog,
    private commonFn: CommonFunctionService,
  ) {}

  ngOnInit(): void {
    this.searchSub = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        this.search = value;
        this.page = 1;
        this.load();
      });

    this.load();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  load(): void {
    this.loading = true;
    this.studentService.list(this.page, this.limit, this.search).subscribe({
      next: (res) => {
        if (res.success) {
          this.students = res.data.map((s) => ({
            ...s,
            displayName: this.buildDisplayName(s),
            displaySubjects: this.buildDisplaySubjects(s),
            subjectsTooltip: this.buildSubjectsTooltip(s),
          }));
          this.total = res.total;
          this.page = res.page;
          this.limit = res.limit;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.commonFn.showToast(
          'Failed to load students. Please try again.',
          'error',
        );
      },
    });
  }

  private buildDisplayName(student: Student): string {
    const parts = [student.firstName, student.guardianName, student.surName].filter(
      (p) => !!p,
    );
    return parts.join(' ');
  }

  private buildDisplaySubjects(student: Student): string {
    const subjectNames = this.getSubjectNames(student);

    if (!subjectNames.length) {
      return '-';
    }

    const maxVisible = 2;
    if (subjectNames.length <= maxVisible) {
      return subjectNames.join(', ');
    }

    const visible = subjectNames.slice(0, maxVisible);
    const remaining = subjectNames.length - maxVisible;
    return `${visible.join(', ')} +${remaining} more`;
  }

  private buildSubjectsTooltip(student: Student): string {
    const subjectNames = this.getSubjectNames(student);
    return subjectNames.join(', ');
  }

  private getSubjectNames(student: Student): string[] {
    return (student.subject && student.subject.length
      ? student.subject
      : (student.selectedSubjects || []).map((s) => s.name)
    ).filter((n) => !!n);
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  openAddModal(): void {
    const dialogRef = this.dialog.open(AddEditStudentModalComponent, {
      // width: '640px',
      data: { student: null },
      panelClass: 'student-dialog-panel',
      closeOnNavigation: false,
      disableClose: true,
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
      closeOnNavigation: false,
      disableClose: true,
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
    const dialogRef = this.dialog.open(DeleteConfirmModalComponent, {
      data: {
        message: 'Are you sure you want to delete this student?',
      },
      panelClass: 'confirm-dialog-panel',
      closeOnNavigation: false,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      this.studentService.delete(student._id as string).subscribe({
        next: () => {
          this.load();
          this.commonFn.showToast('Student deleted successfully.', 'success');
        },
        error: (err) => {
          const msg =
            err?.error?.message || 'Failed to delete student. Please try again.';
          this.commonFn.showToast(msg, 'error');
        },
      });
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

  onLimitChange(limit: number): void {
    if (this.limit === limit) {
      return;
    }
    this.limit = limit;
    this.page = 1;
    this.load();
  }
}
