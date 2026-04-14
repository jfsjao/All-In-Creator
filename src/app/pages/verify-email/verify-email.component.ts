import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private toastr = inject(ToastrService);
  private router = inject(Router);

  status = 'Verificando seu e-mail...';
  success = false;

  async ngOnInit(): Promise<void> {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.status = 'Token de verificação inválido.';
      this.toastr.error('Token de verificação inválido.', 'Erro');
      return;
    }

    try {
      await firstValueFrom(this.apiService.verifyEmail({ token }));
      this.status = 'E-mail confirmado com sucesso.';
      this.success = true;
      this.toastr.success('E-mail confirmado com sucesso.', 'Sucesso');
    } catch (error: any) {
      const message = error?.error?.message || 'Não foi possível verificar o e-mail.';
      this.status = message;
      this.toastr.error(message, 'Erro');
    }
  }

  irParaLogin(): void {
    this.router.navigate(['/auth']);
  }
}
