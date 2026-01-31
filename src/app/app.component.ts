import {Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import {Router, RouterOutlet} from '@angular/router';
import {UserService} from "./core/services/user.service";
import {keycloak} from "./core/services/keycloak-init";
import {AuthService} from "./core/services/auth.service";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'recrutement-intelligent-frontend';

  constructor(private userService: UserService,
              private auth: AuthService,
              private router: Router
  ) {}


  ngOnInit(): void {


    const roles = keycloak.tokenParsed?.realm_access?.roles || [];
    console.log('User roles:', roles);

    this.userService.getCurrentUser().subscribe({
      next: user => {
        console.log('User synchronisé:', user);
        localStorage.setItem('user', JSON.stringify(user));
      },
      error: err => {
        console.error('Erreur sync user', err);
      }
    });
  }
}
