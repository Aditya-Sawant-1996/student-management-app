import { NgModule } from '@angular/core';
import { CommonModuleShared } from '../../core/common/common.module';
import { SettingsRoutingModule } from './settings-routing.module';
import { SettingsComponent } from './settings.component';

@NgModule({
  declarations: [SettingsComponent],
  imports: [CommonModuleShared, SettingsRoutingModule]
})
export class SettingsModule {}
