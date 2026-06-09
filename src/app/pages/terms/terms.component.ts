import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LEGAL_TERMS_VERSION } from '@core/legal-terms';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.scss']
})
export class TermsComponent {
  readonly termsVersion = LEGAL_TERMS_VERSION;
  readonly updatedAt = '09/06/2026';
}
