// src/app/core/services/country.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Country {
  name: string;
  code: string;       // ex: "tn"
  flagUrl: string;    // ex: "https://flagcdn.com/w20/tn.png"
}

@Injectable({ providedIn: 'root' })
export class CountryService {
  private apiUrl = 'https://restcountries.com/v3.1/all?fields=name,cca2';

  constructor(private http: HttpClient) {}

  getCountries(): Observable<Country[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(data =>
        data
          .map(c => ({
            name: c.name.translations?.['fra']?.common ?? c.name.common,
            code: c.cca2.toLowerCase(),
            flagUrl: `https://flagcdn.com/w20/${c.cca2.toLowerCase()}.png`,
          }))
          .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
      )
    );
  }
}
