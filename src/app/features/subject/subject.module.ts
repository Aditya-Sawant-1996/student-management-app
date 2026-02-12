import { NgModule } from '@angular/core';
import { CommonModuleShared } from '../../core/common/common.module';
import { SubjectRoutingModule } from './subject-routing.module';
import { SubjectComponent } from './subject.component';
import { MaterialModule } from '../../shared/material/material.module';
import { AddEditSubjectModalComponent } from '../../shared/add-edit-subject-modal/add-edit-subject-modal.component';

@NgModule({
  declarations: [SubjectComponent, AddEditSubjectModalComponent],
  imports: [
    CommonModuleShared,
    SubjectRoutingModule,
    MaterialModule
  ]
})
export class SubjectModule {}
