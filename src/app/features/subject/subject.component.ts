import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject as RxSubject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { SubjectModel, SubjectService } from './subject.service';
import { AddEditSubjectModalComponent } from '../../shared/add-edit-subject-modal/add-edit-subject-modal.component';
import { DeleteConfirmModalComponent } from '../../shared/delete-confirm-modal/delete-confirm-modal.component';
import { CommonFunctionService } from '../../core/common/common-function.service';

@Component({
  selector: 'app-subject',
  templateUrl: './subject.component.html',
  styleUrls: ['./subject.component.scss']
})
export class SubjectComponent implements OnInit, OnDestroy {
  subjects: SubjectModel[] = [];
  search = '';
  page = 1;
  limit = 10;
  total = 0;
  loading = false;
  pageSizeOptions: number[] = [10, 20, 30, 100];

  tableHeaders = [
    { field: 'subjectName', label: 'Subject Name' },
  ];

  searchPlaceholder = 'Search by subject name...';

  private searchSubject = new RxSubject<string>();
  private searchSub?: Subscription;

  constructor(
    private subjectService: SubjectService,
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
    this.subjectService.list(this.page, this.limit, this.search).subscribe({
      next: (res) => {
        if (res.success) {
          this.subjects = res.data;
          this.total = res.total;
          this.page = res.page;
          this.limit = res.limit;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.commonFn.showToast(
          'Failed to load subjects. Please try again.',
          'error',
        );
      },
    });
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  openAddModal(): void {
    const dialogRef = this.dialog.open(AddEditSubjectModalComponent, {
      data: { subject: null },
      panelClass: 'subject-dialog-panel',
      closeOnNavigation: false,
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.load();
      }
    });
  }

  openEditModal(subject: SubjectModel): void {
    const dialogRef = this.dialog.open(AddEditSubjectModalComponent, {
      data: { subject },
      panelClass: 'subject-dialog-panel',
      closeOnNavigation: false,
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.load();
      }
    });
  }

  onDelete(subject: SubjectModel): void {
    if (!subject._id) {
      return;
    }
    const dialogRef = this.dialog.open(DeleteConfirmModalComponent, {
      data: {
        message: 'Are you sure you want to delete this subject?',
      },
      panelClass: 'confirm-dialog-panel',
      closeOnNavigation: false,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      this.subjectService.delete(subject._id as string).subscribe({
        next: () => {
          this.load();
          this.commonFn.showToast('Subject deleted successfully.', 'success');
        },
        error: (err) => {
          const msg =
            err?.error?.message || 'Failed to delete subject. Please try again.';
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
