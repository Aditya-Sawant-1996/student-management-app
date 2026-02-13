import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModuleShared } from '../../core/common/common.module';
import { MaterialModule } from '../../shared/material/material.module';
import { FeesRoutingModule } from './fees-routing.module';
import { FeesComponent } from './fees.component';
import { AddEditFeesModalComponent } from '../../shared/add-edit-fees-modal/add-edit-fees-modal.component';

@NgModule({
  declarations: [FeesComponent, AddEditFeesModalComponent],
  imports: [CommonModuleShared, MaterialModule, FeesRoutingModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FeesModule {}
