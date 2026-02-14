import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { FeesModel, FeesService, FeesSummaryItem } from './fees.service';
import { AddEditFeesModalComponent } from '../../shared/add-edit-fees-modal/add-edit-fees-modal.component';
import { DeleteConfirmModalComponent } from '../../shared/delete-confirm-modal/delete-confirm-modal.component';
import { CommonFunctionService } from '../../core/common/common-function.service';

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
    { field: 'admissionDateFormatted', label: 'Admission Date' },
    { field: 'mobileNo', label: 'Mobile Number' },
    { field: 'totalFees', label: 'Total Fees' },
    { field: 'feesPaid', label: 'Fees Paid' },
    { field: 'dateFormatted', label: 'Date' },
  ];

  searchPlaceholder = 'Search by student name or mobile...';

  constructor(
    private feesService: FeesService,
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
    this.feesService.list(this.page, this.limit, this.search).subscribe({
      next: (res) => {
        if (res.success) {
          this.fees = res.data.map((f) => ({
            ...f,
            // flatten for table
            studentName: f.selectedStudent?.name,
				// support both new mobileNo and any legacy mobileNumber
				mobileNo:
					f.selectedStudent?.mobileNo ||
					(f.selectedStudent as any)?.mobileNumber,
            admissionDateFormatted: this.formatDate(f.admissionDate),
            dateFormatted: this.formatDate(f.date),
          })) as any;
          this.total = res.total;
          this.page = res.page;
          this.limit = res.limit;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.commonFn.showToast(
          'Failed to load fees records. Please try again.',
          'error',
        );
      },
    });
  }

  private formatDate(value: any): string {
    if (!value) {
      return '';
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) {
      return '';
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
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
      this.feesService.delete(fees._id as string).subscribe({
        next: () => {
          this.commonFn.showToast('Fees record deleted successfully.', 'success');
          this.load();
        },
        error: () => {
          this.commonFn.showToast(
            'Failed to delete fees record. Please try again.',
            'error',
          );
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

  onExportExcel(): void {
    this.feesService.getSummaryByStudent().subscribe({
      next: async (res) => {
        if (!res.success || !res.data?.length) {
				this.commonFn.showToast('No data to export.', 'error');
          return;
        }
        const rows = this.buildExportRows(res.data);
        try {
          const xlsx = await import('xlsx');
          const ws = xlsx.utils.json_to_sheet(rows);
        // Override header row with user-friendly labels
        const headerLabels = [
          'Student Name',
          'Subjects',
          'Total Installments',
          'Total Fee',
          'Monthly Installment',
          'Paid Fees',
          'Amount Due',
          'Last Paid Date',
        ];
        if (ws['!ref']) {
          const range = xlsx.utils.decode_range(ws['!ref']);
          for (let c = 0; c < headerLabels.length; c++) {
            const cellRef = xlsx.utils.encode_cell({ r: range.s.r, c });
            if (!ws[cellRef]) {
              ws[cellRef] = { t: 's', v: headerLabels[c] } as any;
            } else {
              (ws[cellRef] as any).v = headerLabels[c];
              (ws[cellRef] as any).t = 's';
            }
          }
        }
          const wb = xlsx.utils.book_new();
          xlsx.utils.book_append_sheet(wb, ws, 'Fees Summary');
          xlsx.writeFile(wb, 'fees-summary.xlsx');
        } catch {
          this.commonFn.showToast(
            'Failed to export Excel. Please ensure dependencies are installed.',
            'error',
          );
        }
      },
      error: () => {
        this.commonFn.showToast(
          'Failed to fetch data for export.',
          'error',
        );
      },
    });
  }

  onExportPdf(): void {
    this.feesService.getSummaryByStudent().subscribe({
      next: async (res) => {
        if (!res.success || !res.data?.length) {
				this.commonFn.showToast('No data to export.', 'error');
          return;
        }
        const rows = this.buildExportRows(res.data);
        try {
          const jsPDFModule: any = await import('jspdf');
          await import('jspdf-autotable');
          const JsPDF = jsPDFModule.default || jsPDFModule.jsPDF || jsPDFModule;
          const doc = new JsPDF('l', 'pt', 'a4');
          const head = [[
            'Student Name',
            'Subjects',
            'Total Installments',
            'Total Fee',
            'Monthly Installment',
            'Paid Fees',
            'Amount Due',
            'Last Paid Date',
          ]];
          const body = rows.map((r) => [
            r.studentName,
            r.subjects,
            r.totalInstallments,
            r.totalFee,
            r.monthlyInstallment,
            r.paidFees,
            r.amountDue,
            r.lastPaidFeesDate,
          ]);
          (doc as any).autoTable({ head, body, startY: 30, styles: { fontSize: 8 } });
          doc.save('fees-summary.pdf');
        } catch {
          this.commonFn.showToast(
            'Failed to export PDF. Please ensure dependencies are installed.',
            'error',
          );
        }
      },
      error: () => {
        this.commonFn.showToast(
          'Failed to fetch data for export.',
          'error',
        );
      },
    });
  }

  private buildExportRows(items: FeesSummaryItem[]): any[] {
    return items.map((item) => ({
      studentName: item.name,
      subjects: (item.subjects || []).join(', '),
      totalInstallments: item.totalInstallments,
      totalFee: item.totalFees,
      monthlyInstallment: item.monthlyInstallments,
      paidFees: item.totalPaid,
      amountDue: item.amountDue,
      lastPaidFeesDate: this.formatDate(item.lastPaymentDate),
    }));
  }
}
