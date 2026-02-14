import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FeesSelectedStudent {
  studentId: string;
  name: string;
  mobileNo: string;
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
  instalmentNumber: number;
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

export interface FeesSingleResponse {
  success: boolean;
  fees: FeesModel | null;
}

export interface FeesSummaryItem {
  studentId: string;
  name: string;
  subjects: string[];
  totalInstallments: number;
  totalFees: number;
  monthlyInstallments: number;
  totalPaid: number;
  amountDue: number;
  lastPaymentDate: string;
}

export interface FeesSummaryResponse {
  success: boolean;
  data: FeesSummaryItem[];
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

  getLastForStudent(studentId: string): Observable<FeesSingleResponse> {
    return this.http.get<FeesSingleResponse>(
      `${this.baseUrl}/by-student/${studentId}/last`,
    );
  }

	getSummaryByStudent(): Observable<FeesSummaryResponse> {
		return this.http.get<FeesSummaryResponse>(
			`${this.baseUrl}/summary/by-student`,
		);
	}
}
