import { NgModule } from '@angular/core';
import { CommonModuleShared } from '../../../core/common/common.module';
import { AboutRoutingModule } from './about-routing.module';
import { AboutComponent } from './about.component';

@NgModule({
  declarations: [AboutComponent],
  imports: [CommonModuleShared, AboutRoutingModule]
})
export class AboutModule {}
