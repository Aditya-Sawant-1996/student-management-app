import { Component } from '@angular/core';

@Component({
  selector: 'app-settings-about',
  templateUrl: './about.component.html'
})
export class AboutComponent {
  version = '1.0.0';
  supportEmail = 'aplustechnologies1996@gmail.com';
  supportPhone = '8087857706';
  features = [
    'Student admission and profile management',
    'Subject management and batch tracking',
    'Fees collection with installment history',
    'Printable receipts and reports',
    'Role-based access with secure login'
  ];
}
