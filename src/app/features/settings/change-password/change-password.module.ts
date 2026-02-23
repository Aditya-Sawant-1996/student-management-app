import { NgModule } from '@angular/core';
import { CommonModuleShared } from '../../../core/common/common.module';
import { ChangePasswordRoutingModule } from './change-password-routing.module';
import { ChangePasswordComponent } from './change-password.component';

@NgModule({
  declarations: [ChangePasswordComponent],
  imports: [CommonModuleShared, ChangePasswordRoutingModule]
})
export class ChangePasswordModule {}
