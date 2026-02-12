import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SubjectModel {
  _id?: string;
  subjectName: string;
}

export interface SubjectListResponse {
  success: boolean;
  data: SubjectModel[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root',
})
export class SubjectService {
  private baseUrl = 'http://localhost:3000/api/subjects';

  constructor(private http: HttpClient) {}

  list(page = 1, limit = 10, search = ''): Observable<SubjectListResponse> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<SubjectListResponse>(this.baseUrl, { params });
  }

  create(payload: { subjectName: string }): Observable<any> {
    return this.http.post(this.baseUrl, payload);
  }

  update(id: string, payload: { subjectName: string }): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
