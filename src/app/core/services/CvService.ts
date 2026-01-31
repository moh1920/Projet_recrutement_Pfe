import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {CvData} from "../models/CvData";

@Injectable({
  providedIn: 'root'
})
export class CvService {

  private API_URL = 'http://localhost:8080/api/cv/upload';

  constructor(private http: HttpClient) {}

  uploadCv(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(this.API_URL, formData);
  }

}
