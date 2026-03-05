import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoginService } from '../../core/auth/login.service';
import { Router } from '@angular/router';
import { CommonFunctionService } from '../../core/common/common-function.service';
import { AuthService } from '../../core/auth/auth.service';
import { InstituteSettingsService } from '../../core/settings/institute-settings.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  createUserForm!: FormGroup;
  forgotForm!: FormGroup;
  errorMsg = '';
  createErrorMsg = '';
  forgotErrorMsg = '';
  isChecking = true;
  hasSystemUser = false;
  otpSent = false;
  forgotOtpSent = false;
  isForgotMode = false;
  showLoginPassword = false;
  showCreatePassword = false;
  showCreateConfirmPassword = false;
  showResetPassword = false;
  showResetConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private loginService: LoginService,
    private router: Router,
    private commonFunction: CommonFunctionService,
    private authService: AuthService,
    private instituteSettings: InstituteSettingsService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.createUserForm = this.fb.group(
      {
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        instituteName: ['', Validators.required],
        password: ['', Validators.required],
        confirmPassword: ['', Validators.required],
        otp: ['']
      },
      { validators: [this.passwordMatchValidator] }
    );

    this.forgotForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        otp: [''],
        newPassword: [''],
        confirmPassword: ['']
      },
      { validators: [this.passwordMatchValidator] }
    );

    this.loginService.checkSystemUserExists().subscribe({
      next: (res) => {
        this.hasSystemUser = !!res.exists;
        if (res.user?.email) {
          this.loginForm.patchValue({ email: res.user.email });
          this.loginForm.get('email')?.disable({ emitEvent: false });
          this.forgotForm.patchValue({ email: res.user.email });
          this.forgotForm.get('email')?.disable({ emitEvent: false });
        }
        this.isChecking = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'Unable to check user status';
        this.isChecking = false;
      }
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      return;
    }
    const { email, password } = this.loginForm.getRawValue();
    this.loginService.login(email, password).subscribe({
      next: (res) => {
        if (res.success) {
          this.errorMsg = '';
          if (res.user) {
            localStorage.setItem('systemUser', JSON.stringify(res.user));
            if (res.user.name) {
              localStorage.setItem('systemUserName', res.user.name);
            }
            this.instituteSettings.setInstituteName(res.user.instituteName || '');
            if (res.user.instituteLogo) {
              this.instituteSettings.setLogo(res.user.instituteLogo);
            } else {
              this.instituteSettings.clearLogo();
            }
          }
          if (res.token && res.expiresAt) {
            this.authService.setSession(res.token, res.expiresAt);
          }
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMsg = '';
          this.commonFunction.showToast(
            res.message || 'Invalid email or password',
            'error'
          );
        }
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = '';
        this.commonFunction.showToast(
          err?.error?.message || 'Server error',
          'error'
        );
      }
    });
  }

  onCreateUser(): void {
    this.createErrorMsg = '';
    if (this.createUserForm.invalid) {
      this.createUserForm.markAllAsTouched();
      return;
    }

    const { name, email, instituteName, password, otp } =
      this.createUserForm.value;

    if (!this.otpSent) {
      this.loginService.requestSystemUserOtp({ email, name }).subscribe({
        next: (res) => {
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
          this.commonFunction.showToast(
            err?.error?.message || 'Unable to send verification code',
            'error'
          );
        }
      });

      return;
    }

    if (!otp) {
      this.createUserForm.get('otp')?.markAsTouched();
      return;
    }

    this.loginService
      .createSystemUser({ name, email, instituteName, password, otp })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.hasSystemUser = true;
            this.otpSent = false;
            this.enableOtpValidation(false);
            if (res.user) {
              localStorage.setItem('systemUser', JSON.stringify(res.user));
              if (res.user.name) {
                localStorage.setItem('systemUserName', res.user.name);
              }
              this.instituteSettings.setInstituteName(
                res.user.instituteName || ''
              );
            }
            this.createUserForm.reset();
            this.commonFunction.showToast(
              res.message || 'User created successfully',
              'success'
            );
          } else {
            this.commonFunction.showToast(
              res.message || 'Unable to create user',
              'error'
            );
          }
        },
        error: (err) => {
          console.error(err);
          this.commonFunction.showToast(
            err?.error?.message || 'Unable to create user',
            'error'
          );
        }
      });
  }

  onForgotPassword(): void {
    this.isForgotMode = true;
    this.forgotErrorMsg = '';
    if (this.loginForm.get('email')?.value && !this.forgotForm.get('email')?.value) {
      this.forgotForm.patchValue({ email: this.loginForm.get('email')?.value });
    }
  }

  onCancelForgot(): void {
    this.isForgotMode = false;
    this.forgotOtpSent = false;
    this.enableForgotValidation(false);
    const email = this.loginForm.get('email')?.value || '';
    this.forgotForm.reset({ email });
  }

  onSendForgotOtp(): void {
    this.forgotErrorMsg = '';
    if (this.forgotForm.get('email')?.invalid) {
      this.forgotForm.get('email')?.markAsTouched();
      return;
    }

    const email = this.forgotForm.getRawValue().email;
    this.loginService.requestPasswordResetOtp({ email }).subscribe({
      next: (res) => {
        if (res.success) {
          this.forgotOtpSent = true;
          this.enableForgotValidation(true);
          this.commonFunction.showToast(
            res.message || 'Verification code sent',
            'success'
          );
        } else {
          this.forgotErrorMsg = res.message || 'Unable to send verification code';
          this.commonFunction.showToast(
            res.message || 'Unable to send verification code',
            'error'
          );
        }
      },
      error: (err) => {
        console.error(err);
        this.forgotErrorMsg =
          err?.error?.message || 'Unable to send verification code';
        this.commonFunction.showToast(
          err?.error?.message || 'Unable to send verification code',
          'error'
        );
      }
    });
  }

  onResetPassword(): void {
    this.forgotErrorMsg = '';
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    const { email, otp, newPassword } = this.forgotForm.getRawValue();

    this.loginService.resetPassword({ email, otp, newPassword }).subscribe({
      next: (res) => {
        if (res.success) {
          this.forgotOtpSent = false;
          this.enableForgotValidation(false);
          this.forgotForm.reset({ email: email || '' });
          if (res.user) {
            localStorage.setItem('systemUser', JSON.stringify(res.user));
            if (res.user.name) {
              localStorage.setItem('systemUserName', res.user.name);
            }
            this.instituteSettings.setInstituteName(res.user.instituteName || '');
          }
          this.commonFunction.showToast(
            res.message || 'Password reset successful',
            'success'
          );
          this.isForgotMode = false;
        } else {
          this.forgotErrorMsg = res.message || 'Unable to reset password';
          this.commonFunction.showToast(
            res.message || 'Unable to reset password',
            'error'
          );
        }
      },
      error: (err) => {
        console.error(err);
        this.forgotErrorMsg =
          err?.error?.message || 'Unable to reset password';
        this.commonFunction.showToast(
          err?.error?.message || 'Unable to reset password',
          'error'
        );
      }
    });
  }

  private passwordMatchValidator(group: FormGroup) {
    const password =
      group.get('password')?.value || group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    if (!password || !confirmPassword) {
      return null;
    }
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  private enableOtpValidation(enabled: boolean): void {
    const otpControl = this.createUserForm.get('otp');
    if (!otpControl) {
      return;
    }
    if (enabled) {
      otpControl.setValidators([Validators.required, Validators.minLength(6)]);
    } else {
      otpControl.clearValidators();
      otpControl.setValue('');
    }
    otpControl.updateValueAndValidity();
  }

  private enableForgotValidation(enabled: boolean): void {
    const otpControl = this.forgotForm.get('otp');
    const passwordControl = this.forgotForm.get('newPassword');
    const confirmControl = this.forgotForm.get('confirmPassword');

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
}
