import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { FeesMonthlySummaryItem, FeesService } from '../fees/fees.service';
import { StudentService } from '../student/student.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {
  totalStudents = 0;
  monthlyFees: FeesMonthlySummaryItem[] = [];
  totalFeesCollectedCurrentYear = 0;
  loading = false;
  private sub = new Subscription();
  currentYear = new Date().getFullYear();

  constructor(
    private studentService: StudentService,
    private feesService: FeesService,
  ) {}

  ngOnInit(): void {
    this.loadTotals();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private loadTotals(): void {
    this.loading = true;
    const year = new Date().getFullYear();
    const students$ = this.studentService.list(1, 1, '');
    const fees$ = this.feesService.getMonthlySummary(year);
    this.sub.add(
      students$.subscribe({
        next: (res) => {
          this.totalStudents = res.total;
        },
        complete: () => {
          // handled in combined loading flag below
        },
      }),
    );
    this.sub.add(
      fees$.subscribe({
        next: (res) => {
          this.monthlyFees = res.data || [];
          this.totalFeesCollectedCurrentYear = this.monthlyFees.reduce(
            (sum, m) => sum + (m.totalCollected || 0),
            0,
          );
        },
        complete: () => {
          this.loading = false;
        },
      }),
    );
  }
}
