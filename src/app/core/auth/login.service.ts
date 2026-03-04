import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface LoginResponse {
  success: boolean;
  token?: string;
  expiresAt?: string;
  user?: any;
  message?: string;
}

interface SystemUserExistsResponse {
  success: boolean;
  exists: boolean;
  user?: any;
  message?: string;
}

interface CreateSystemUserResponse {
  success: boolean;
  user?: any;
  message?: string;
}

interface RequestOtpResponse {
  success: boolean;
  message?: string;
}

interface ResetPasswordResponse {
  success: boolean;
  user?: any;
  message?: string;
}

interface UpdateLogoResponse {
  success: boolean;
  user?: any;
  message?: string;
}

interface UpdateSystemUserResponse {
  success: boolean;
  user?: any;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private baseUrl = 'http://localhost:3000/api/auth';  // adjust your API base

  constructor(private http: HttpClient) {}

  checkSystemUserExists(): Observable<SystemUserExistsResponse> {
    return this.http.get<SystemUserExistsResponse>(`${this.baseUrl}/system-user`);
  }

  createSystemUser(payload: {
    name: string;
    email: string;
    instituteName: string;
    password: string;
    otp: string;
  }): Observable<CreateSystemUserResponse> {
    return this.http.post<CreateSystemUserResponse>(`${this.baseUrl}/system-user`, payload);
  }

  requestSystemUserOtp(payload: {
    email: string;
    name?: string;
  }): Observable<RequestOtpResponse> {
    return this.http.post<RequestOtpResponse>(`${this.baseUrl}/system-user/request-otp`, payload);
  }

  requestPasswordResetOtp(payload: {
    email: string;
  }): Observable<RequestOtpResponse> {
    return this.http.post<RequestOtpResponse>(`${this.baseUrl}/system-user/reset-password/request-otp`, payload);
  }

  resetPassword(payload: {
    email: string;
    otp: string;
    newPassword: string;
  }): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(`${this.baseUrl}/system-user/reset-password`, payload);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, { email, password });
  }

  updateSystemUserLogo(logo: string): Observable<UpdateLogoResponse> {
    return this.http.patch<UpdateLogoResponse>(
      `${this.baseUrl}/system-user/logo`,
      { logo }
    );
  }

  updateSystemUserDetails(payload: {
    instituteName: string;
    instituteAddress?: string;
    instituteContact?: string;
    instituteCode?: string;
  }): Observable<UpdateSystemUserResponse> {
    return this.http.patch<UpdateSystemUserResponse>(
      `${this.baseUrl}/system-user/details`,
      payload
    );
  }

  deleteSystemUserLogo(): Observable<UpdateLogoResponse> {
    return this.http.delete<UpdateLogoResponse>(
      `${this.baseUrl}/system-user/logo`
    );
  }

  // You can add logout, token storage etc.
}
