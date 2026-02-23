import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { LoginService } from '../../../core/auth/login.service';
import { CommonFunctionService } from '../../../core/common/common-function.service';

@Component({
  selector: 'app-settings-change-password',
  templateUrl: './change-password.component.html'
})
export class ChangePasswordComponent implements OnInit {
  changeForm!: FormGroup;
  otpSent = false;
  showNewPassword = false;
  showConfirmPassword = false;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private loginService: LoginService,
    private authService: AuthService,
    private commonFunction: CommonFunctionService
  ) {}

  ngOnInit(): void {
    const email = this.readEmail();
    this.changeForm = this.fb.group(
      {
        email: [{ value: email, disabled: !!email }, [Validators.required, Validators.email]],
        otp: [''],
        newPassword: [''],
        confirmPassword: ['']
      },
      { validators: [this.passwordMatchValidator] }
    );
  }

  onSendOtp(): void {
    if (this.changeForm.get('email')?.invalid) {
      this.changeForm.get('email')?.markAsTouched();
      return;
    }

    const email = this.changeForm.getRawValue().email;
    this.isSubmitting = true;
    this.loginService.requestPasswordResetOtp({ email }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success) {
          this.otpSent = true;
          this.enableOtpValidation(true);
          this.commonFunction.showToast(
            res.message || 'Verification code sent',
            'success'
          );
        } else {
          this.commonFunction.showToast(
            res.message || 'Unable to send verification code',
            'error'
          );
        }
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting = false;
        this.commonFunction.showToast(
          err?.error?.message || 'Unable to send verification code',
          'error'
        );
      }
    });
  }

  onChangePassword(): void {
    if (!this.otpSent) {
      this.commonFunction.showToast('Please request an OTP first.', 'error');
      return;
    }
    if (this.changeForm.invalid) {
      this.changeForm.markAllAsTouched();
      return;
    }

    const { email, otp, newPassword } = this.changeForm.getRawValue();
    this.isSubmitting = true;
    this.loginService.resetPassword({ email, otp, newPassword }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success) {
          if (res.user) {
            this.persistSystemUser(res.user);
          }
          this.commonFunction.showToast(
            res.message || 'Password has been updated.',
            'success'
          );
          setTimeout(() => {
            this.authService.clearSession({ showMessage: false, navigate: true });
          }, 400);
        } else {
          this.commonFunction.showToast(
            res.message || 'Unable to reset password',
            'error'
          );
        }
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting = false;
        this.commonFunction.showToast(
          err?.error?.message || 'Unable to reset password',
          'error'
        );
      }
    });
  }

  private passwordMatchValidator(group: FormGroup) {
    const password = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    if (!password || !confirmPassword) {
      return null;
    }
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  private enableOtpValidation(enabled: boolean): void {
    const otpControl = this.changeForm.get('otp');
    const passwordControl = this.changeForm.get('newPassword');
    const confirmControl = this.changeForm.get('confirmPassword');

    if (!otpControl || !passwordControl || !confirmControl) {
      return;
    }

    if (enabled) {
      otpControl.setValidators([Validators.required, Validators.minLength(6)]);
      passwordControl.setValidators([Validators.required]);
      confirmControl.setValidators([Validators.required]);
    } else {
      otpControl.clearValidators();
      passwordControl.clearValidators();
      confirmControl.clearValidators();
      otpControl.setValue('');
      passwordControl.setValue('');
      confirmControl.setValue('');
    }

    otpControl.updateValueAndValidity();
    passwordControl.updateValueAndValidity();
    confirmControl.updateValueAndValidity();
  }

  private readEmail(): string {
    try {
      const stored = localStorage.getItem('systemUser');
      if (stored) {
        const user = JSON.parse(stored) as { email?: string };
        if (user?.email) {
          return user.email;
        }
      }
      return localStorage.getItem('systemUserEmail') || '';
    } catch {
      return '';
    }
  }

  private persistSystemUser(user: { name?: string }): void {
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
