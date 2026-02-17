import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SelectedSubject {
  _id: string;
  name: string;
}

export interface Student {
  _id?: string;
  name?: string; // derived on backend from firstName + surName
  surName: string;
  firstName: string;
  guardianName: string;
  mothersName: string;
  subject: string[];
  selectedSubjects?: SelectedSubject[];
  batch?: string;
  batchStart?: string; // ISO date string from backend
  batchEnd?: string;   // ISO date string from backend
  address: string;
  aadhaarNumber: string;
  mobileNo: string;
  email?: string;
  birthPlace: string;
  dateOfBirth: string; // ISO string from backend
  gender: 'Male' | 'Female' | 'Other';
  handicapped: 'Yes' | 'No';
  latestEducation: string;
  previousSchoolName: string;
  photo: string; // server path to uploaded photo
  // Derived display fields for UI
  displayName?: string;
  displaySubjects?: string;
  subjectsTooltip?: string;
  // Fees summary fields populated from backend list API
  totalFees?: number;
  totalFeesPaid?: number;
  pendingFees?: number;
}

export interface StudentListResponse {
  success: boolean;
  data: Student[];
  total: number;
  page: number;
  limit: number;
}

export interface StudentSingleResponse {
	success: boolean;
	student: Student | null;
}

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private baseUrl = 'http://localhost:3000/api/students';

  constructor(private http: HttpClient) {}

  list(page = 1, limit = 10, search = ''): Observable<StudentListResponse> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<StudentListResponse>(this.baseUrl, { params });
  }

  create(payload: FormData): Observable<any> {
    return this.http.post(this.baseUrl, payload);
  }

  update(id: string, payload: FormData): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

	getById(id: string): Observable<StudentSingleResponse> {
		return this.http.get<StudentSingleResponse>(`${this.baseUrl}/${id}`);
	}
}
