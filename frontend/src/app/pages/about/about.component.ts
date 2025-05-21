import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CountUpModule } from 'ngx-countup';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule, CountUpModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {
  clients = [
    { logo: 'playtruco.png', name: 'Play Truco' },
    { logo: 'estilovivo.png', name: 'Estilo Vivo' },
    { logo: 'mid.png', name: 'MID Conveniencia' },
    { logo: 'pedraoferramentas.png', name: 'Pedro Ferramentas' },
    { logo: 'viptech.png', name: 'Vip Tech' },
    { logo: 'azznatural.png', name: 'Azz Natural' },
  ];

  // Valores para as animações
  stats = {
    years: 1,
    clients: 5,
    engagements: 10,
    satisfaction: 100
  };

  getImagePath(logo: string): string {
    return `assets/images/logos/${logo}`;
  }

}