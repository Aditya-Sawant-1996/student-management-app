import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent {

  @Input() tableHeaders: { field: string; label: string }[] = [];
  @Input() tableData: any[] = [];
  @Input() searchPlaceholder = 'Search...';

  @Output() addClicked = new EventEmitter<void>();
  @Output() editClicked = new EventEmitter<any>();
  @Output() deleteClicked = new EventEmitter<any>();
  @Output() searchChange = new EventEmitter<string>();

  onSearch(value: string): void {
    this.searchChange.emit(value);
  }

  onAdd(): void {
    this.addClicked.emit();
  }

  onEdit(row: any): void {
    this.editClicked.emit(row);
  }

  onDelete(row: any): void {
    this.deleteClicked.emit(row);
  }

}
