import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NavigationExtras, Router, RouterOutlet } from '@angular/router';
import { FooterComponent } from './components/footer/footer.component';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    FooterComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private router = inject(Router);

  title = 'All In - Creator';

  ngOnInit(): void {
    this.redirectFirebaseActionLinks();
    this.redirectMercadoPagoReturnLinks();
  }

  private redirectFirebaseActionLinks(): void {
    const urlTree = this.router.parseUrl(this.router.url);
    const mode = urlTree.queryParamMap.get('mode');
    const oobCode = urlTree.queryParamMap.get('oobCode');
    const currentPath = urlTree.root.children['primary']?.segments.map((segment) => segment.path).join('/') ?? '';

    if (!mode || !oobCode || currentPath === 'auth/action') {
      return;
    }

    const navigationExtras: NavigationExtras = {
      queryParams: { ...urlTree.queryParams },
      replaceUrl: true
    };

    this.router.navigate(['/auth/action'], navigationExtras);
  }

  private redirectMercadoPagoReturnLinks(): void {
    const urlTree = this.router.parseUrl(this.router.url);
    const paymentId = urlTree.queryParamMap.get('payment_id');
    const status = urlTree.queryParamMap.get('status') ?? urlTree.queryParamMap.get('collection_status');
    const currentPath = urlTree.root.children['primary']?.segments.map((segment) => segment.path).join('/') ?? '';

    if (!paymentId || currentPath.startsWith('payment/')) {
      return;
    }

    const targetPath =
      status === 'approved'
        ? '/client-area'
        : status === 'pending' || status === 'in_process'
          ? '/payment/pending'
          : '/payment/failure';

    const navigationExtras: NavigationExtras = {
      queryParams: { ...urlTree.queryParams },
      replaceUrl: true
    };

    this.router.navigate([targetPath], navigationExtras);
  }
}
