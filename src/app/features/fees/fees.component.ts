import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { FeesModel, FeesService, FeesSummaryItem } from './fees.service';
import { AddEditFeesModalComponent } from '../../shared/add-edit-fees-modal/add-edit-fees-modal.component';
import { DeleteConfirmModalComponent } from '../../shared/delete-confirm-modal/delete-confirm-modal.component';
import { CommonFunctionService } from '../../core/common/common-function.service';
import { InstituteSettingsService } from '../../core/settings/institute-settings.service';

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
    { field: 'batchRange', label: 'Batch' },
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
    private instituteSettings: InstituteSettingsService,
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
            batchRange: this.buildBatchRange(
              f.selectedStudent?.batchStart,
              f.selectedStudent?.batchEnd,
            ),
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

  async onPrint(fees: FeesModel & { studentName?: string }): Promise<void> {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      this.commonFn.showToast(
        'Please allow pop-ups to print the receipt.',
        'error',
      );
      return;
    }

    const logo = this.instituteSettings.getLogo();
    const institute = this.getInstituteDetails();
    const pdfUrl = await this.buildReceiptPdfUrl(fees, logo, institute);
    const html = this.buildReceiptHtml(fees, logo, pdfUrl, institute);

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    if (pdfUrl) {
      printWindow.onbeforeunload = () => {
        URL.revokeObjectURL(pdfUrl);
      };
    }
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
          'Batch',
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
          const timestamp = this.buildExportTimestamp();
          xlsx.writeFile(wb, `fees-summary-${timestamp}.xlsx`);
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
            'Batch',
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
            r.batchRange,
            r.subjects,
            r.totalInstallments,
            r.totalFee,
            r.monthlyInstallment,
            r.paidFees,
            r.amountDue,
            r.lastPaidFeesDate,
          ]);
          (doc as any).autoTable({ head, body, startY: 30, styles: { fontSize: 8 } });
          const timestamp = this.buildExportTimestamp();
          doc.save(`fees-summary-${timestamp}.pdf`);
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
      batchRange: this.buildBatchRange(item.batchStart, item.batchEnd),
      subjects: (item.subjects || []).join(', '),
      totalInstallments: item.totalInstallments,
      totalFee: item.totalFees,
      monthlyInstallment: item.monthlyInstallments,
      paidFees: item.totalPaid,
      amountDue: item.amountDue,
      lastPaidFeesDate: this.formatDate(item.lastPaymentDate),
    }));
  }

  private buildExportTimestamp(): string {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dd = pad(d.getDate());
    const mm = pad(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    let hours = d.getHours();
    const minutes = pad(d.getMinutes());
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    if (hours === 0) {
      hours = 12;
    }
    const hh = pad(hours);
    return `${dd}-${mm}-${yyyy}-${hh}-${minutes}-${ampm}`;
  }

  private buildReceiptHtml(
    fees: FeesModel,
    logo: string | null,
    pdfUrl: string | null,
    institute: {
      name: string;
      address: string;
      code: string;
      contact: string;
    },
  ): string {
    const receiptDate = this.escapeHtml(this.formatDate(fees.date));
    const receiptNo = fees._id ? this.escapeHtml(fees._id) : '';
    const studentName = this.escapeHtml(
      fees.selectedStudent?.name || (fees as any)?.studentName || '',
    );
    const subjects = this.escapeHtml(
      (fees.subjects?.length
        ? fees.subjects
        : fees.selectedStudent?.subjects || []
      ).join(', '),
    );
    const installmentNumber =
      fees.instalmentNumber !== null && fees.instalmentNumber !== undefined
        ? this.escapeHtml(String(fees.instalmentNumber))
        : '';
    const amount = this.formatAmount(fees.feesPaid);
    const amountDisplay = amount ? `&#8377;${amount}` : '';

    const instituteName = this.escapeHtml(institute.name);
    const instituteAddress = this.escapeHtml(institute.address);
    const instituteCode = this.escapeHtml(institute.code);
    const instituteContact = this.escapeHtml(institute.contact);

    const logoMarkup = logo
      ? `<div class="logo-wrap"><img src="${logo}" alt="Institute logo" class="logo" /></div>`
      : '';

    const downloadMarkup = pdfUrl
      ? `<a class="btn secondary" href="${pdfUrl}" download="fee-receipt-${receiptNo || 'receipt'}.pdf">Download PDF</a>`
      : `<button type="button" class="btn secondary" disabled>Download PDF</button>`;

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Fee Receipt</title>
    <style>
      @page { size: A4; margin: 15mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: #111;
        font-family: "Times New Roman", serif;
        font-size: 12pt;
      }
      .controls {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 12px 16px;
        background: #f5f5f5;
        border-bottom: 1px solid #ddd;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #111;
        background: #fff;
        color: #111;
        padding: 6px 14px;
        font-size: 12pt;
        cursor: pointer;
        text-decoration: none;
      }
      .btn.secondary {
        border-color: #0f766e;
        color: #0f766e;
      }
      .btn:disabled {
        border-color: #999;
        color: #999;
        cursor: not-allowed;
      }
      @media print {
        .controls {
          display: none;
        }
      }
      .receipt {
        max-width: 170mm;
        margin: 0 auto;
      }
      .logo-wrap {
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .logo {
        max-height: 48px;
        max-width: 120px;
        object-fit: contain;
      }
      .logo-placeholder {
        font-size: 12pt;
        font-weight: 700;
        letter-spacing: 1px;
      }
      .institute-header {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 12px;
        margin-bottom: 6px;
      }
      .institute-block {
        text-align: center;
      }
      .institute-name {
        font-size: 13.5pt;
        font-weight: 700;
        margin-bottom: 2px;
      }
      .institute-meta {
        font-size: 11.5pt;
        line-height: 1.3;
      }
      .line {
        border-top: 1px solid #000;
        margin: 6px 0;
      }
      .title {
        text-align: center;
        font-weight: 700;
        font-size: 14pt;
        letter-spacing: 1px;
      }
      .row {
        display: flex;
        gap: 8px;
        margin: 6px 0;
      }
      .label {
        min-width: 140px;
        font-weight: 600;
      }
      .value {
        flex: 1;
      }
      .two-col {
        width: 100%;
        border-collapse: collapse;
      }
      .two-col th,
      .two-col td {
        padding: 4px 8px;
      }
      .two-col .amount {
        text-align: right;
      }
      .two-col .desc {
        text-align: left;
      }
      .two-col th:first-child,
      .two-col td:first-child {
        width: 70%;
      }
      .two-col th.amount,
      .two-col td.amount {
        width: 30%;
      }
      .spacer {
        height: 10px;
      }
      .spacer-lg {
        height: 16px;
      }
      .footer {
        display: flex;
        justify-content: space-between;
        margin-top: 8px;
      }
    </style>
  </head>
  <body>
    <div class="controls">
      ${downloadMarkup}
      <button type="button" class="btn" onclick="window.print()">Print / Save</button>
    </div>
    <div class="receipt">
      <div class="institute-header">
        ${logoMarkup}
        <div class="institute-block">
          <div class="institute-name">${instituteName || '&nbsp;'}</div>
          <div class="institute-meta">${instituteAddress || '&nbsp;'}</div>
          <div class="institute-meta">${instituteCode || '&nbsp;'}</div>
          <div class="institute-meta">${instituteContact || '&nbsp;'}</div>
        </div>
      </div>
      <div class="line"></div>
      <div class="title">FEE RECEIPT</div>
      <div class="line"></div>

      <div class="row">
        <div class="label">Receipt No:</div>
        <div class="value">${receiptNo}</div>
      </div>
      <div class="row">
        <div class="label">Date:</div>
        <div class="value">${receiptDate}</div>
      </div>
      <div class="row">
        <div class="label">Received from:</div>
        <div class="value">${studentName}</div>
      </div>
      <div class="row">
        <div class="label">Subject:</div>
        <div class="value">${subjects}</div>
      </div>
      <div class="row">
        <div class="label">Installment Number:</div>
        <div class="value">${installmentNumber}</div>
      </div>

      <div class="line"></div>

      <table class="two-col">
        <tr>
          <th class="desc">Description</th>
          <th class="amount">&#8377;</th>
        </tr>
      </table>

      <div class="line"></div>
      <div class="spacer"></div>
      <div class="spacer"></div>

      <table class="two-col">
        <tr>
          <td class="desc">Tution Fee:</td>
          <td class="amount">${amountDisplay}</td>
        </tr>
      </table>
      <div class="line"></div>
      <table class="two-col">
        <tr>
          <td class="desc"></td>
          <td class="amount"><strong>Total:</strong> ${amountDisplay}</td>
        </tr>
      </table>
      <div class="line"></div>

      <div class="spacer-lg"></div>
      <div class="spacer-lg"></div>
      <div class="spacer-lg"></div>
      <div class="spacer-lg"></div>

      <div class="footer">
        <div>Seal</div>
        <div>Accountant</div>
      </div>
    </div>
  </body>
</html>`;
  }

  private async buildReceiptPdfUrl(
    fees: FeesModel,
    logo: string | null,
    institute: {
      name: string;
      address: string;
      code: string;
      contact: string;
    },
  ): Promise<string | null> {
    try {
      const jsPDFModule: any = await import('jspdf');
      const JsPDF = jsPDFModule.default || jsPDFModule.jsPDF || jsPDFModule;
      const doc = new JsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const hasUnicodeFont = await this.ensurePdfFont(doc);
      const fontName = hasUnicodeFont ? 'Nirmala' : 'times';
      const boldStyle = hasUnicodeFont ? 'normal' : 'bold';

      const pageWidth = 210;
      const margin = 15;
      const right = pageWidth - margin;
      const labelX = margin;
      const valueX = margin + 45;
      const lineGap = 6;
      const rowGap = 3;
      const receiptNo = fees._id ? String(fees._id) : '';
      const receiptDate = this.formatDate(fees.date);
      const studentName =
        fees.selectedStudent?.name || (fees as any)?.studentName || '';
      const subjects = (fees.subjects?.length
        ? fees.subjects
        : fees.selectedStudent?.subjects || []
      ).join(', ');
      const installmentNumber =
        fees.instalmentNumber !== null && fees.instalmentNumber !== undefined
          ? String(fees.instalmentNumber)
          : '';
      const amount = this.formatAmount(fees.feesPaid);
      const amountDisplay = amount ? `₹${amount}` : '';

      let y = margin;
      const instituteName = institute.name || '';
      const metaLines = [
        institute.address || '',
        institute.code || '',
        institute.contact || '',
      ].filter(Boolean);

      if (logo) {
        const imgType = logo.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        const logoWidth = 40;
        const logoHeight = 22;
        const gap = 6;
        const textBlockWidth = 120;
        const totalWidth = logoWidth + gap + textBlockWidth;
        const startX = Math.max(margin, (pageWidth - totalWidth) / 2);
        const logoX = startX;
        const textX = startX + logoWidth + gap;
        const textCenterX = textX + textBlockWidth / 2;

        doc.addImage(logo, imgType, logoX, y, logoWidth, logoHeight);

        doc.setFont(fontName, boldStyle);
        doc.setFontSize(13);
        const nameY = y + 5;
        if (instituteName) {
          doc.text(instituteName, textCenterX, nameY, { align: 'center' });
        }
        doc.setFont(fontName, 'normal');
        doc.setFontSize(11);
        let metaY = y + 11;
        metaLines.forEach((line) => {
          doc.text(line, textCenterX, metaY, { align: 'center' });
          metaY += 5;
        });

        const textHeight = Math.max(logoHeight, 6 + metaLines.length * 5);
        y += textHeight + 4;
      } else {
        doc.setFont(fontName, boldStyle);
        doc.setFontSize(13);
        if (instituteName) {
          doc.text(instituteName, pageWidth / 2, y + 5, { align: 'center' });
        }
        doc.setFont(fontName, 'normal');
        doc.setFontSize(11);
        let metaY = y + 11;
        metaLines.forEach((line) => {
          doc.text(line, pageWidth / 2, metaY, { align: 'center' });
          metaY += 5;
        });
        y = Math.max(y + 5 + metaLines.length * 5, y + 18);
      }

      doc.setLineWidth(0.2);
      doc.line(margin, y, right, y);
      y += lineGap;

      doc.setFont(fontName, boldStyle);
      doc.setFontSize(14);
      doc.text('FEE RECEIPT', pageWidth / 2, y, { align: 'center' });
      y += lineGap;

      doc.setFont(fontName, 'normal');
      doc.setFontSize(12);
      doc.line(margin, y, right, y);
      y += lineGap;

      const addRow = (label: string, value: string): void => {
        doc.text(label, labelX, y);
        const maxWidth = right - valueX;
        const lines = value
          ? doc.splitTextToSize(value, maxWidth)
          : [''];
        doc.text(lines, valueX, y);
        y += lineGap * Math.max(lines.length, 1) + rowGap;
      };

      addRow('Receipt No:', receiptNo);
      addRow('Date:', receiptDate);
      addRow('Received from:', studentName);
      addRow('Subject:', subjects);
      addRow('Installment Number:', installmentNumber);

      doc.line(margin, y, right, y);
      y += lineGap;

      doc.setFont(fontName, boldStyle);
      doc.text('Description', margin, y);
      doc.text('₹', right, y, { align: 'right' });
      doc.setFont(fontName, 'normal');
      y += lineGap;

      doc.line(margin, y, right, y);
      y += lineGap + 2;

      doc.text('Tution Fee:', margin, y);
      doc.text(amountDisplay, right, y, { align: 'right' });
      y += lineGap;

      doc.line(margin, y, right, y);
      y += lineGap;

      doc.setFont(fontName, boldStyle);
      doc.text(amountDisplay ? `Total: ${amountDisplay}` : 'Total:', right, y, {
        align: 'right',
      });
      doc.setFont(fontName, 'normal');
      y += lineGap;

      doc.line(margin, y, right, y);
      y += lineGap * 3;

      doc.text('Seal', margin, y);
      doc.text('Accountant', right, y, { align: 'right' });

      const blob = doc.output('blob');
      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  }

  private formatAmount(value: number | null | undefined): string {
    const num = Number(value);
    if (!isFinite(num)) {
      return '';
    }
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private getInstituteDetails(): {
    name: string;
    address: string;
    code: string;
    contact: string;
  } {
    try {
      const raw = localStorage.getItem('systemUser');
      if (!raw) {
        return { name: '', address: '', code: '', contact: '' };
      }
      const user = JSON.parse(raw) as any;
      return {
        name: user?.instituteName || '',
        address: user?.instituteAddress || '',
        code: user?.instituteCode || '',
        contact: user?.instituteContact || '',
      };
    } catch {
      return { name: '', address: '', code: '', contact: '' };
    }
  }

  private pdfFontData?: string;

  private async ensurePdfFont(doc: any): Promise<boolean> {
    if (!this.pdfFontData) {
      try {
        const response = await fetch('assets/fonts/Nirmala.ttf');
        if (!response.ok) {
          this.pdfFontData = '';
          return false;
        }
        const buffer = await response.arrayBuffer();
        this.pdfFontData = this.arrayBufferToBase64(buffer);
      } catch {
        this.pdfFontData = '';
        return false;
      }
    }

    if (!this.pdfFontData) {
      return false;
    }

    try {
      doc.addFileToVFS('Nirmala.ttf', this.pdfFontData);
      doc.addFont('Nirmala.ttf', 'Nirmala', 'normal');
      doc.setFont('Nirmala', 'normal');
      return true;
    } catch {
      return false;
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let binary = '';
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
  }

  private buildBatchRange(
    start?: string,
    end?: string,
  ): string {
    const startStr = start ? new Date(start) : null;
    const endStr = end ? new Date(end) : null;
    const fmt = (d: Date | null) =>
      d && !isNaN(d.getTime())
        ? d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
        : '';
    const s = fmt(startStr);
    const e = fmt(endStr);
    if (s && e) {
      return `${s} - ${e}`;
    }
    return s || e || '';
  }
}
