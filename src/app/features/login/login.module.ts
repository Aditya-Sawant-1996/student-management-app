import { NgModule } from '@angular/core';
import { CommonModuleShared } from '../../core/common/common.module';
import { LoginRoutingModule } from './login-routing.module';
import { LoginComponent } from './login.component';

@NgModule({
  declarations: [
    LoginComponent
  ],
  imports: [
    CommonModuleShared,
    LoginRoutingModule
  ]
})
export class LoginModule {}
