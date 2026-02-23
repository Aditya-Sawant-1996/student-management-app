import { NgModule } from '@angular/core';
import { CommonModuleShared } from '../../../core/common/common.module';
import { DetailsRoutingModule } from './details-routing.module';
import { DetailsComponent } from './details.component';

@NgModule({
  declarations: [DetailsComponent],
  imports: [CommonModuleShared, DetailsRoutingModule]
})
export class DetailsModule {}
