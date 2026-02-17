import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { FeesModel, FeesService } from '../../features/fees/fees.service';
import { Student, StudentService } from '../../features/student/student.service';
import { CommonFunctionService } from '../../core/common/common-function.service';

@Component({
  selector: 'app-add-edit-fees-modal',
  templateUrl: './add-edit-fees-modal.component.html',
  styleUrls: ['./add-edit-fees-modal.component.scss'],
})
export class AddEditFeesModalComponent implements OnInit, OnDestroy {
  fees: FeesModel | null = null;

  form: FormGroup;
  submitted = false;
  loading = false;
  readonly today = new Date();

  students: Student[] = [];
  studentSearchControl = new FormControl('');
  private studentSearch$ = new Subject<string>();
  private studentSearchSub?: Subscription;

  selectedStudentBatchStart: string | null = null;
  selectedStudentBatchEnd: string | null = null;

  get isEdit(): boolean {
    return !!(this.fees && this.fees._id);
  }

  constructor(
    private fb: FormBuilder,
    private feesService: FeesService,
    private studentService: StudentService,
    private commonFn: CommonFunctionService,
    @Inject(MAT_DIALOG_DATA) public data: { fees: FeesModel | null },
    private dialogRef: MatDialogRef<AddEditFeesModalComponent>,
  ) {
    this.fees = data?.fees ?? null;

    this.form = this.fb.group({
      selectedStudentId: ['', [Validators.required]],
      subjects: [[], [Validators.required]],
      admissionDate: [null, [Validators.required]],
      totalFees: ['', [Validators.required]],
      totalInstallments: [null, [Validators.required, Validators.min(1)]],
      monthlyInstallments: [{ value: '', disabled: true }],
      instalmentNumber: [null, [Validators.required, Validators.min(1)]],
      feesPaid: ['', [Validators.required]],
      date: [new Date(), [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.submitted = false;

    this.studentSearchSub = this.studentSearch$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => this.studentService.list(1, 20, term)),
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.students = res.data;
          } else {
            this.students = [];
            this.commonFn.showToast(
              'Failed to load students for fees. Please try again.',
              'error',
            );
          }
        },
        error: () => {
          this.students = [];
          this.commonFn.showToast(
            'Failed to load students for fees. Please try again.',
            'error',
          );
        },
      });

    this.studentSearchControl.valueChanges.subscribe((value) => {
      if (typeof value === 'string') {
        this.studentSearch$.next(value || '');
      }
    });

    if (this.fees) {
      this.form.patchValue({
        selectedStudentId: this.fees.selectedStudent?.studentId,
        subjects: this.fees.subjects || [],
        admissionDate: this.fees.admissionDate
          ? new Date(this.fees.admissionDate)
          : null,
        totalFees: this.formatAmount(this.fees.totalFees),
        totalInstallments: this.fees.totalInstallments,
        monthlyInstallments: this.formatAmount(this.fees.monthlyInstallments),
        instalmentNumber: this.fees.instalmentNumber,
        feesPaid: this.formatAmount(this.fees.feesPaid),
        date: this.fees.date ? new Date(this.fees.date) : new Date(),
      });

      if (this.fees.selectedStudent?.name) {
        this.studentSearchControl.setValue(this.fees.selectedStudent.name);
      }

      // Load batch start/end for the selected student so we can show it in edit mode
      const studentId = this.fees.selectedStudent?.studentId;
      if (studentId) {
        this.studentService.getById(studentId).subscribe({
          next: (res) => {
            if (!res.success || !res.student) {
              return;
            }
            this.selectedStudentBatchStart = res.student.batchStart ?? null;
            this.selectedStudentBatchEnd = res.student.batchEnd ?? null;
          },
          error: () => {
            // Ignore errors; batch info is optional UI.
          },
        });
      }
    }

    this.form.get('totalFees')?.valueChanges.subscribe(() => {
      this.updateMonthlyInstallmentsDisplay();
    });
    this.form.get('totalInstallments')?.valueChanges.subscribe(() => {
      this.updateMonthlyInstallmentsDisplay();
    });
  }

  ngOnDestroy(): void {
    this.studentSearchSub?.unsubscribe();
  }

  displayStudent(student: Student | string | null): string {
    if (!student) return '';
    if (typeof student === 'string') return student;
    return `${student.name} (${student.aadhaarNumber}) - ${student.mobileNo}`;
  }

  onStudentSelected(student: Student): void {
    if (!student._id) {
      return;
    }

    const selectedStudentId = student._id;
    this.selectedStudentBatchStart = student.batchStart ?? null;
    this.selectedStudentBatchEnd = student.batchEnd ?? null;
    this.form.patchValue({
      selectedStudentId,
      subjects:
        (student as any).selectedSubjects?.map((s: any) => s.name) ||
        student.subject || [],
    });

    // Prefill fees fields from the last fees record for this student, if any
    this.feesService.getLastForStudent(selectedStudentId).subscribe({
      next: (res) => {
        // If user changed selection while the request was in flight,
        // ignore this response to avoid patching stale data.
        if (this.form.get('selectedStudentId')?.value !== selectedStudentId) {
          return;
        }

        if (!res.success || !res.fees) {
          // No previous fees for this student: clear any data that might
          // have been prefilled from another student.
          this.form.patchValue({
            admissionDate: null,
            totalFees: '',
            totalInstallments: null,
            monthlyInstallments: '',
            instalmentNumber: null,
            feesPaid: '',
            date: new Date(),
          });

          this.commonFn.showToast(
            'No previous fees found for this student. Please enter details.',
            'success',
          );
          return;
        }
        const last = res.fees;
        const nextInstalmentNumber =
          (last.instalmentNumber ?? 0) + 1;
        this.form.patchValue({
          admissionDate: last.admissionDate
            ? new Date(last.admissionDate)
            : null,
          totalFees: this.formatAmount(last.totalFees),
          totalInstallments: last.totalInstallments,
          monthlyInstallments: this.formatAmount(last.monthlyInstallments),
          instalmentNumber: nextInstalmentNumber,
          feesPaid: this.formatAmount(last.feesPaid),
          subjects: last.subjects && last.subjects.length
            ? last.subjects
            : this.form.get('subjects')?.value,
          // date is intentionally NOT patched so it stays as current date
        });

        this.commonFn.showToast(
          `Previous fees data loaded. Installment number set to ${nextInstalmentNumber}.`,
          'success',
        );
      },
      error: () => {
        this.commonFn.showToast(
          'Failed to load previous fees data. Please fill manually.',
          'error',
        );
      },
    });
  }

  get subjectsList(): string[] {
    return this.form.get('subjects')?.value || [];
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

    const formValue = this.form.getRawValue();

    const totalFeesNum = this.parseAmount(formValue.totalFees);
    const totalInstallmentsNum = Number(formValue.totalInstallments);
    const feesPaidNum = this.parseAmount(formValue.feesPaid);

    const payload: any = {
      studentId: formValue.selectedStudentId,
      admissionDate: this.toIsoDate(formValue.admissionDate),
      totalFees: totalFeesNum,
      totalInstallments: totalInstallmentsNum,
      monthlyInstallments:
        totalInstallmentsNum > 0 ? totalFeesNum / totalInstallmentsNum : 0,
      instalmentNumber: formValue.instalmentNumber,
      feesPaid: feesPaidNum,
      date: this.toIsoDate(formValue.date),
    };

    this.loading = true;

    if (this.isEdit && this.fees && this.fees._id) {
      this.feesService.update(this.fees._id, payload).subscribe({
        next: () => {
          this.loading = false;
          this.submitted = false;
          this.form.reset();
          this.dialogRef.close(true);
          this.commonFn.showToast('Fees updated successfully.', 'success');
        },
        error: (err) => {
          this.loading = false;
          const msg =
            err?.error?.message || 'Failed to update fees. Please try again.';
          this.commonFn.showToast(msg, 'error');
        },
      });
    } else {
      this.feesService.create(payload).subscribe({
        next: () => {
          this.loading = false;
          this.submitted = false;
          this.form.reset();
          this.dialogRef.close(true);
          this.commonFn.showToast('Fees created successfully.', 'success');
        },
        error: (err) => {
          this.loading = false;
          const msg =
            err?.error?.message || 'Failed to create fees. Please try again.';
          this.commonFn.showToast(msg, 'error');
        },
      });
    }
  }

  private toIsoDate(value: any): string {
    const date: Date = value instanceof Date ? value : new Date(value);
    return date.toISOString();
  }

  private parseAmount(value: string | number): number {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const cleaned = value.toString().replace(/,/g, '');
    const num = Number(cleaned);
    return isNaN(num) ? 0 : num;
  }

  private formatAmount(value: number | null | undefined): string {
    if (value === null || value === undefined) return '';
    return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }

  onAmountBlur(controlName: 'totalFees' | 'feesPaid'): void {
    const control = this.form.get(controlName);
    if (!control) {
      return;
    }
    const num = this.parseAmount(control.value);
    control.setValue(this.formatAmount(num));
  }

  private updateMonthlyInstallmentsDisplay(): void {
    const totalFeesNum = this.parseAmount(this.form.get('totalFees')?.value);
    const totalInstallmentsNum = Number(
      this.form.get('totalInstallments')?.value,
    );
    const monthly =
      totalInstallmentsNum > 0 ? totalFeesNum / totalInstallmentsNum : 0;
    this.form.get('monthlyInstallments')?.setValue(
      this.formatAmount(monthly),
      { emitEvent: false },
    );
  }
}
