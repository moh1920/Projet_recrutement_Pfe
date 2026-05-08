// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { environment } from '../../../environments/environment';
// import { N8nScoringResponse } from '../models/n8n-scoring.model';
// import { Offre } from '../models/offre.model';
//
// @Injectable({
//   providedIn: 'root',
// })
// export class N8nScoringService {
//   private readonly baseUrl = `${environment.apiUrl}/offre`;
//
//   constructor(private http: HttpClient) {}
//
//   /**
//    * Sends the offre to the backend which triggers the n8n workflow
//    * to search LinkedIn candidates from Google Sheet and score them.
//    */
//   scorerOffre(offre: Offre): Observable<N8nScoringResponse[]> {
//     return this.http.post<N8nScoringResponse[]>(
//       `${this.baseUrl}/scorer-offre`,
//       offre
//     );
//   }
// }
