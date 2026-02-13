import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FeesSelectedStudent {
  studentId: string;
  name: string;
  aadhaarNumber: string;
  subjects: string[];
}

export interface FeesModel {
  _id?: string;
  selectedStudent: FeesSelectedStudent;
  subjects: string[];
  admissionDate: string; // ISO
  totalFees: number;
  totalInstallments: number;
  monthlyInstallments: number;
  instalmentNumber: string;
  feesPaid: number;
  date: string; // ISO
}

export interface FeesListResponse {
  success: boolean;
  data: FeesModel[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root',
})
export class FeesService {
  private baseUrl = 'http://localhost:3000/api/fees';

  constructor(private http: HttpClient) {}

  list(page = 1, limit = 10, search = ''): Observable<FeesListResponse> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<FeesListResponse>(this.baseUrl, { params });
  }

  create(payload: any): Observable<any> {
    return this.http.post(this.baseUrl, payload);
  }

  update(id: string, payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
