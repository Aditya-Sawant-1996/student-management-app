import { Component } from '@angular/core';

interface SettingsCard {
  key: string;
  label: string;
  description: string;
  icon: string;
  show: boolean;
  iconClass: string;
  route?: string;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html'
})
export class SettingsComponent {
  cards: SettingsCard[] = [
    {
      key: 'about',
      label: 'About',
      description: 'Version info, support contacts, and system overview.',
      icon: 'info',
      show: true,
      iconClass: 'text-amber-600 dark:text-amber-300',
      route: '/settings/about'
    },
    {
      key: 'details',
      label: 'Details',
      description: 'Institute profile, address, and contact details.',
      icon: 'badge',
      show: true,
      iconClass: 'text-sky-600 dark:text-sky-300'
    },
    {
      key: 'printers',
      label: 'Printers',
      description: 'Manage default printers and print preferences.',
      icon: 'print',
      show: true,
      iconClass: 'text-emerald-600 dark:text-emerald-300'
    },
    {
      key: 'change-password',
      label: 'Change Password',
      description: 'Update your login password securely.',
      icon: 'lock',
      show: true,
      iconClass: 'text-rose-600 dark:text-rose-300'
    }
  ];
}
