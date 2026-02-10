import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Student {
  _id?: string;
  name?: string; // derived on backend from the name parts
  firstName: string;
  middleName?: string;
  lastName: string;
  fullNameMarathi?: string;
  gender?: 'Male' | 'Female' | 'Other';
  dateOfBirth?: string; // ISO string from backend
  age: number;
  bloodGroup?: string;
  nationality?: string;
  class: string;
}

export interface StudentListResponse {
  success: boolean;
  data: Student[];
  total: number;
  page: number;
  limit: number;
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

  create(student: Student): Observable<any> {
    return this.http.post(this.baseUrl, student);
  }

  update(id: string, student: Partial<Student>): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, student);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
