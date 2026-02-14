import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent {

  @Input() tableHeaders: { field: string; label: string; tooltipField?: string }[] = [];
  @Input() tableData: any[] = [];
  @Input() searchPlaceholder = 'Search...';
  @Input() addButtonLabel = 'Add New';
  @Input() showEditAction = true;
  @Input() showDeleteAction = true;
  @Input() showViewAction = true;
  @Input() loading = false;
  @Input() page = 1;
  @Input() totalPages = 1;
  @Input() total = 0;
  @Input() limit = 10;
  @Input() limitOptions: number[] = [10, 20, 30, 100];
  @Input() moduleLabel = 'items';
	@Input() showExport = false;

	@Output() exportPdfClicked = new EventEmitter<void>();
	@Output() exportExcelClicked = new EventEmitter<void>();

  @Output() addClicked = new EventEmitter<void>();
  @Output() editClicked = new EventEmitter<any>();
  @Output() deleteClicked = new EventEmitter<any>();
  @Output() viewClicked = new EventEmitter<any>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() prevPageClicked = new EventEmitter<void>();
  @Output() nextPageClicked = new EventEmitter<void>();
  @Output() limitChange = new EventEmitter<number>();

  onSearch(value: string): void {
    this.searchChange.emit(value);
  }

  onAdd(): void {
    this.addClicked.emit();
  }

  onExportPdf(): void {
    this.exportPdfClicked.emit();
  }

  onExportExcel(): void {
    this.exportExcelClicked.emit();
  }

  onEdit(row: any): void {
    this.editClicked.emit(row);
  }

  onDelete(row: any): void {
    this.deleteClicked.emit(row);
  }

  onView(row: any): void {
    this.viewClicked.emit(row);
  }

  onPrevPage(): void {
    this.prevPageClicked.emit();
  }

  onNextPage(): void {
    this.nextPageClicked.emit();
  }

  onLimitChange(value: number): void {
    this.limitChange.emit(value);
  }

}
