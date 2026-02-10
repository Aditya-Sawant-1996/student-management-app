import { NgModule } from '@angular/core';
import { StudentRoutingModule } from './student-routing.module';
import { StudentComponent } from './student.component';
import { AddEditStudentModalComponent } from '../../shared/add-edit-student-modal/add-edit-student-modal.component';
import { CommonModuleShared } from '../../core/common/common.module';
import { MaterialModule } from '../../shared/material/material.module';

@NgModule({
  declarations: [StudentComponent, AddEditStudentModalComponent],
  imports: [
    CommonModuleShared,
    StudentRoutingModule,
    MaterialModule,
  ],
})
export class StudentModule {}
