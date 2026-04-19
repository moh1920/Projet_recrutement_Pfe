import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserService } from './core/services/user.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  userService = inject(UserService);

  async ngOnInit(): Promise<void> {
    //  await this.notifService.connect();  // Lance WebSocket + charge l'historique

    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        console.log('User synchronisé:', user);
        localStorage.setItem('user', JSON.stringify(user));
      },
      error: (err) => {
        console.error('Erreur sync user', err);
      },
    });
  }
  title = 'esprit-smart-recruit';
}
