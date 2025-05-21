// services.component.ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CountUpModule } from 'ngx-countup';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, CountUpModule, RouterLink],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss']
})
export class ServicesComponent {
  stats = {
    clients: 150,
    engagements: 5000000,
    satisfaction: 98,
    projects: 300
  };

  scrollToForm() {
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
  }
}