import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '@core/api.service';
import { AuthService } from '@core/services/auth.service';

type PaymentStatusMode = 'success' | 'pending' | 'failure';

interface PaymentStatusCopy {
  badge: string;
  title: string;
  description: string;
  tone: 'success' | 'pending' | 'failure';
  primaryLabel: string;
  primaryLink: string;
  secondaryLabel: string;
  secondaryLink: string;
}

@Component({
  selector: 'app-payment-status',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-status.component.html',
  styleUrl: './payment-status.component.scss'
})
export class PaymentStatusComponent {
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);

  readonly isSyncingPayment = signal(false);
  readonly paymentSyncMessage = signal<string | null>(null);

  readonly mode = computed<PaymentStatusMode>(() => {
    const path = this.route.snapshot.routeConfig?.path;

    if (path === 'payment/pending') {
      return 'pending';
    }

    if (path === 'payment/failure') {
      return 'failure';
    }

    return 'success';
  });

  readonly paymentInfo = computed(() => {
    const query = this.route.snapshot.queryParamMap;

    return {
      paymentId: query.get('payment_id'),
      status: query.get('status'),
      externalReference: query.get('external_reference'),
      merchantOrderId: query.get('merchant_order_id')
    };
  });

  readonly copy = computed<PaymentStatusCopy>(() => {
    switch (this.mode()) {
      case 'pending':
        return {
          badge: 'Pagamento pendente',
          title: 'Estamos aguardando a confirmacao do pagamento',
          description:
            'Se você escolheu Pix, boleto ou outro meio com confirmação posterior, a liberação acontece assim que o Mercado Pago confirmar a operação.',
          tone: 'pending',
          primaryLabel: 'Ir para area do cliente',
          primaryLink: '/client-area',
          secondaryLabel: 'Ver meus downloads',
          secondaryLink: '/my-downloads'
        };
      case 'failure':
        return {
          badge: 'Pagamento não concluído',
          title: 'Não conseguimos confirmar essa compra',
          description:
            'Você pode tentar novamente com outro meio de pagamento ou voltar para o checkout do plano escolhido.',
          tone: 'failure',
          primaryLabel: 'Voltar aos planos',
          primaryLink: '/plans',
          secondaryLabel: 'Falar com suporte',
          secondaryLink: '/contact'
        };
      default:
        return {
          badge: 'Pagamento aprovado',
          title: 'Compra concluida com sucesso',
          description:
            'Seu pagamento foi confirmado. Agora e so seguir para sua area e aproveitar os packs liberados no plano.',
          tone: 'success',
          primaryLabel: 'Ir para biblioteca',
          primaryLink: '/library',
          secondaryLabel: 'Ir para area do cliente',
          secondaryLink: '/client-area'
        };
    }
  });

  async ngOnInit(): Promise<void> {
    const paymentId = this.paymentInfo().paymentId;

    if (!paymentId) {
      return;
    }

    await this.authService.waitForAuthInit();

    if (!this.authService.isAuthenticated()) {
      return;
    }

    this.isSyncingPayment.set(true);
    this.paymentSyncMessage.set(null);

    try {
      const status = await firstValueFrom(this.apiService.syncMercadoPagoReturn(paymentId));
      await this.authService.refreshCurrentUser();

      if (status.payment.status === 'aprovado') {
        this.paymentSyncMessage.set(`Plano ${status.plan.nome} liberado com sucesso.`);
      } else if (status.payment.status === 'pendente') {
        this.paymentSyncMessage.set('Pagamento recebido. Estamos aguardando a confirmacao final.');
      }
    } catch (error: any) {
      const message =
        error?.error?.message || 'Não foi possível sincronizar seu pagamento agora.';
      this.paymentSyncMessage.set(message);
      this.toastr.warning(message, 'Pagamento');
    } finally {
      this.isSyncingPayment.set(false);
    }
  }
}
