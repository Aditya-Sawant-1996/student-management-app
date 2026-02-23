import { Component, OnInit } from '@angular/core';
import { CommonFunctionService } from '../../../core/common/common-function.service';
import { LoginService } from '../../../core/auth/login.service';
import { InstituteSettingsService } from '../../../core/settings/institute-settings.service';

interface SystemUser {
  name?: string;
  email?: string;
  instituteName?: string;
  phone?: string;
  role?: string;
  instituteLogo?: string;
}

@Component({
  selector: 'app-settings-details',
  templateUrl: './details.component.html'
})
export class DetailsComponent implements OnInit {
  systemUser: SystemUser | null = null;
  systemUserName = '';
  logoPreview: string | null = null;
  isDragOver = false;
  readonly maxLogoSizeMb = 5;

  constructor(
    private commonFunction: CommonFunctionService,
    private loginService: LoginService,
    private instituteSettings: InstituteSettingsService
  ) {}

  ngOnInit(): void {
    this.systemUser = this.loadSystemUser();
    this.systemUserName = this.systemUser?.name || this.readSystemUserName();
    this.logoPreview = this.instituteSettings.getLogo();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length ? input.files[0] : null;
    if (!file) {
      return;
    }
    this.handleFile(file);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (!files || !files.length) {
      return;
    }
    this.handleFile(files[0]);
  }

  onDeleteLogo(): void {
    this.loginService.deleteSystemUserLogo().subscribe({
      next: (res) => {
        if (!res.success || !res.user) {
          this.commonFunction.showToast(
            res.message || 'Unable to remove logo.',
            'error'
          );
          return;
        }
        this.persistSystemUser(res.user);
        this.instituteSettings.clearLogo();
        this.logoPreview = null;
        this.commonFunction.showToast('Logo removed successfully.', 'success');
      },
      error: (err) => {
        console.error(err);
        this.commonFunction.showToast(
          err?.error?.message || 'Unable to remove logo.',
          'error'
        );
      }
    });
  }

  private handleFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.commonFunction.showToast('Please upload an image file.', 'error');
      return;
    }

    const maxBytes = this.maxLogoSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      this.commonFunction.showToast(
        `Logo size must be ${this.maxLogoSizeMb} MB or less.`,
        'error'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) {
        this.commonFunction.showToast('Failed to read the file.', 'error');
        return;
      }
      this.loginService.updateSystemUserLogo(dataUrl).subscribe({
        next: (res) => {
          if (!res.success || !res.user) {
            this.commonFunction.showToast(
              res.message || 'Unable to update logo.',
              'error'
            );
            return;
          }

          this.persistSystemUser(res.user);
          const stored = this.instituteSettings.setLogo(
            res.user.instituteLogo || dataUrl
          );
          if (!stored) {
            this.commonFunction.showToast(
              'Unable to cache logo locally. Please use a smaller file.',
              'error'
            );
            return;
          }
          this.logoPreview = res.user.instituteLogo || dataUrl;
          this.commonFunction.showToast('Logo updated successfully.', 'success');
        },
        error: (err) => {
          console.error(err);
          this.commonFunction.showToast(
            err?.error?.message || 'Unable to update logo.',
            'error'
          );
        }
      });
    };
    reader.onerror = () => {
      this.commonFunction.showToast('Failed to read the file.', 'error');
    };
    reader.readAsDataURL(file);
  }

  private loadSystemUser(): SystemUser | null {
    try {
      const raw = localStorage.getItem('systemUser');
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as SystemUser;
    } catch {
      return null;
    }
  }

  private readSystemUserName(): string {
    try {
      return localStorage.getItem('systemUserName') || '';
    } catch {
      return '';
    }
  }

  private persistSystemUser(user: SystemUser): void {
    try {
      localStorage.setItem('systemUser', JSON.stringify(user));
      if (user?.name) {
        localStorage.setItem('systemUserName', user.name);
      }
    } catch {
      // ignore storage errors
    }
  }
}
