import {Component, inject, OnInit} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {UserService} from './core/services/user.service';
import {StatusUser} from "./core/models/create-user-request.model";

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
        this.userService.updateStatusUser(user.id, StatusUser.ACTIF).subscribe({
          next: () => {
            console.log('Status user mis à jour en Actif');
          },
          error: (err) => {
            console.error('Erreur mise à jour status user', err);
          },
        });
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
