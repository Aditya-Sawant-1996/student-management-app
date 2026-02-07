import { NgModule } from '@angular/core';
import { StudentRoutingModule } from './student-routing.module';
import { StudentComponent } from './student.component';
import { StudentListComponent } from './student-list.component';
import { CommonModuleShared } from '../../core/common/common.module';

@NgModule({
  declarations: [StudentComponent, StudentListComponent],
  imports: [
    CommonModuleShared,
    StudentRoutingModule,
  ],
})
export class StudentModule {}
