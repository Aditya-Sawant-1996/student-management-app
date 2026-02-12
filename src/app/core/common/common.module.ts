import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ListComponent } from '../../shared/list/list.component';
import { MaterialModule } from '../../shared/material/material.module';
import { DeleteConfirmModalComponent } from '../../shared/delete-confirm-modal/delete-confirm-modal.component';

@NgModule({
  declarations: [ListComponent, DeleteConfirmModalComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MaterialModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ListComponent,
    DeleteConfirmModalComponent
  ]
})
export class CommonModuleShared {}
