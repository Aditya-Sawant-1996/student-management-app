import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { FeesModel, FeesService } from './fees.service';
import { AddEditFeesModalComponent } from '../../shared/add-edit-fees-modal/add-edit-fees-modal.component';
import { DeleteConfirmModalComponent } from '../../shared/delete-confirm-modal/delete-confirm-modal.component';

@Component({
  selector: 'app-fees',
  templateUrl: './fees.component.html',
})
export class FeesComponent implements OnInit, OnDestroy {
  fees: FeesModel[] = [];
  search = '';
  page = 1;
  limit = 10;
  total = 0;
  loading = false;
  pageSizeOptions: number[] = [10, 20, 30, 100];
  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  tableHeaders = [
    { field: 'studentName', label: 'Student' },
    { field: 'aadhaarNumber', label: 'Aadhaar' },
    { field: 'subjects', label: 'Subjects' },
    { field: 'totalFees', label: 'Total Fees' },
    { field: 'feesPaid', label: 'Fees Paid' },
    { field: 'date', label: 'Date' },
  ];

  searchPlaceholder = 'Search by student name or Aadhaar...';

  constructor(
    private feesService: FeesService,
    private dialog: MatDialog,
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
    this.feesService.list(this.page, this.limit, this.search).subscribe({
      next: (res) => {
        if (res.success) {
          this.fees = res.data.map((f) => ({
            ...f,
            // flatten for table
            studentName: f.selectedStudent?.name,
            aadhaarNumber: f.selectedStudent?.aadhaarNumber,
          })) as any;
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
    this.searchSubject.next(value);
  }

  openAddModal(): void {
    const dialogRef = this.dialog.open(AddEditFeesModalComponent, {
      data: { fees: null },
      panelClass: 'fees-dialog-panel',
      closeOnNavigation: false,
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.load();
      }
    });
  }

  openEditModal(fees: FeesModel & { studentName?: string; aadhaarNumber?: string }): void {
    const dialogRef = this.dialog.open(AddEditFeesModalComponent, {
      data: { fees },
      panelClass: 'fees-dialog-panel',
      closeOnNavigation: false,
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.load();
      }
    });
  }

  onDelete(fees: FeesModel & { _id?: string }): void {
    if (!fees._id) {
      return;
    }
    const dialogRef = this.dialog.open(DeleteConfirmModalComponent, {
      data: {
        message: 'Are you sure you want to delete this fees record? ',
      },
      panelClass: 'confirm-dialog-panel',
      closeOnNavigation: false,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      this.feesService.delete(fees._id as string).subscribe(() => {
        this.load();
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
