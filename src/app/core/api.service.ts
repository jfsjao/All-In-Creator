import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { auth } from './firebase';

export interface SyncAuthPayload {
  nome: string | null;
  email: string | null;
  provedor_autenticacao: string;
  id_usuario_provedor: string;
  foto_url: string | null;
  termos_aceitos?: boolean;
  termos_versao?: string;
}

export interface PlanoAtualResponse {
  id: string;
  slug: 'gratuito' | 'basic' | 'pro' | 'premium';
  nome: string;
  descricao?: string | null;
  preco?: string;
  status_usuario_plano?: string;
  iniciado_em?: string;
  expira_em?: string | null;
}

export interface SyncAuthResponse {
  message: string;
  primeiro_acesso: boolean;
  usuario: {
    id: string;
    nome: string | null;
    email: string;
    role?: 'cliente' | 'admin';
    provedor_autenticacao: string;
    id_usuario_provedor: string | null;
    foto_url: string | null;
    criado_em: string;
    atualizado_em: string;
  };
  plano_atual: PlanoAtualResponse | null;
}

export interface RegisterEmailPayload {
  nome: string | null;
  email: string;
  senha: string;
  termos_aceitos?: boolean;
  termos_versao?: string;
}

export interface LoginEmailPayload {
  email: string;
  senha: string;
}

export interface AuthTokenResponse {
  token: string;
  usuario: {
    id: string;
    nome: string | null;
    email: string;
    role?: 'cliente' | 'admin';
    provedor_autenticacao: string;
    id_usuario_provedor: string | null;
    foto_url: string | null;
    termos_versao?: string | null;
    termos_aceitos_em?: string | null;
    criado_em: string;
    atualizado_em: string;
  };
}

export interface VerifyEmailPayload {
  token: string;
}

export interface ResendEmailPayload {
  email: string;
}

export interface RequestResetPayload {
  email: string;
}

export interface FirebaseVerificationEmailPayload {
  nome: string | null;
}

export interface ResetPasswordPayload {
  token: string;
  nova_senha: string;
}

export interface ChangePasswordPayload {
  senha_atual: string;
  nova_senha: string;
}

export interface PackResponse {
  id: number;
  slug: string;
  nome: string;
  descricao: string;
  capa_url: string | null;
  arquivo_url: string | null;
  tamanho_gb: string | null;
  principal: boolean;
  ativo: boolean;
}

export interface AdminPlanoResponse {
  id: number;
  slug: 'gratuito' | 'basic' | 'pro' | 'premium';
  nome: string;
  descricao: string | null;
  preco: string;
  ativo: boolean;
  total_packs: number;
}

export interface AdminPackResponse extends PackResponse {
  versao: string | null;
  planos: Array<'gratuito' | 'basic' | 'pro' | 'premium'>;
  palavras_chave: string[];
  criado_em: string;
  atualizado_em: string;
}

export interface AdminPackPayload {
  slug: string;
  nome: string;
  descricao: string;
  capa_url: string | null;
  arquivo_url: string | null;
  tamanho_gb: string | number | null;
  principal: boolean;
  ativo: boolean;
  versao: string | null;
  planos: Array<'gratuito' | 'basic' | 'pro' | 'premium'>;
  palavras_chave: string[];
}

export type AdminEmailSegment = 'all' | 'gratuito' | 'basic' | 'pro' | 'premium';

export interface AdminEmailCampaignPayload {
  segment: AdminEmailSegment;
  subject: string;
  title: string;
  body: string;
  cta_label: string | null;
  cta_url: string | null;
  test_email?: string | null;
}

export interface AdminEmailCampaignResponse {
  message: string;
  sent: number;
  total: number;
  segment: AdminEmailSegment;
  test: boolean;
}

export interface AdminEmailRecipientsPreviewResponse {
  segment: AdminEmailSegment;
  total: number;
  daily_limit: number | null;
  exceeds_daily_limit: boolean;
  by_plan: Array<{
    plano_slug: AdminEmailSegment;
    total: number;
  }>;
}

export interface AdminUsersByAreaMetric {
  area_atuacao: string;
  total_usuarios: number;
}

export interface AdminTopDownloadedPackMetric {
  pack_id: number;
  slug: string;
  nome: string;
  total_downloads: number;
  usuarios_unicos: number;
}

export interface AdminTopPackByAreaMetric extends AdminTopDownloadedPackMetric {
  area_atuacao: string;
}

export interface AdminMetricsResponse {
  usuarios_por_area: AdminUsersByAreaMetric[];
  packs_mais_baixados: AdminTopDownloadedPackMetric[];
  packs_mais_baixados_por_area: AdminTopPackByAreaMetric[];
}

export interface SiteContentResponseItem {
  id?: number;
  chave: string;
  tipo: 'client_area_slide' | 'client_area_news';
  titulo: string;
  subtitulo: string | null;
  conteudo: Record<string, unknown>;
  ativo: boolean;
  ordem: number;
}

export interface ClientAreaContentResponse {
  slides: SiteContentResponseItem[];
  news: SiteContentResponseItem[];
  has_configured_content?: boolean;
}

export interface PacksDestaqueResponse {
  total: number;
  packs: PackResponse[];
}

export interface PacksListResponse {
  total: number;
  packs: PackResponse[];
}

export interface MeusPacksResponse {
  usuario_id: number;
  plano_atual: {
    id: number;
    slug: 'gratuito' | 'basic' | 'pro' | 'premium';
    nome: string;
    status: string;
    iniciado_em: string;
    expira_em: string | null;
  } | null;
  packs: PackResponse[];
}

export interface UsuarioPerfilResponse {
  usuario: {
    id: number;
    nome: string | null;
    email: string;
    telefone: string | null;
    area_atuacao: string | null;
    foto_url: string | null;
    termos_versao?: string | null;
    termos_aceitos_em?: string | null;
    criado_em: string;
    atualizado_em: string;
  };
}

export interface AtualizarPerfilPayload {
  nome: string;
  email: string;
  telefone: string;
  area_atuacao: string;
}

export interface ContactPayload {
  nome: string;
  email: string;
  telefone: string;
  assunto: 'orcamento' | 'duvida' | 'parceria' | 'agendamento';
  mensagem: string;
}

export interface DownloadsResumoResponse {
  total_downloads: number;
  total_atualizacoes: number;
  downloads_recentes: Array<{
    id: number;
    slug: string;
    nome: string;
    descricao: string;
    capa_url: string | null;
    tamanho_gb: string | null;
    versao_atual: string | null;
    versao_baixada: string | null;
    baixado_em: string;
    possui_atualizacao: boolean;
  }>;
  sugestoes: Array<{
    id: number;
    slug: string;
    nome: string;
    descricao: string;
    capa_url: string | null;
    tamanho_gb: string | null;
    versao_atual: string | null;
    versao_baixada: string | null;
    baixado_em: string;
    possui_atualizacao: boolean;
  }>;
}

export type PaidPlanSlug = 'basic' | 'pro' | 'premium';

export interface CreateCheckoutResponse {
  paymentId: number;
  preferenceId: string;
  publicKey: string | null;
  checkoutUrl: string;
  sandboxCheckoutUrl: string | null;
  externalReference: string;
  chargedAmount: string;
  checkoutKind: 'purchase' | 'upgrade';
  plan: {
    id: number;
    slug: PaidPlanSlug;
    nome: string;
    preco: string;
  };
  currentPlan: {
    id: number;
    slug: 'gratuito' | PaidPlanSlug;
    nome: string;
    preco: string;
  } | null;
}

export interface PaymentStatusResponse {
  payment: {
    id: number;
    providerPaymentId: string | null;
    preferenceId: string | null;
    externalReference: string | null;
    status: string;
    statusDetail: string | null;
    amount: string;
    currency: string;
    paidAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  plan: {
    id: number;
    slug: 'gratuito' | PaidPlanSlug;
    nome: string;
  };
}

export interface UserActivityResponse {
  id: number;
  usuario_id: number;
  tipo:
    | 'login'
    | 'logout'
    | 'download'
    | 'password_reset_requested'
    | 'password_changed'
    | 'profile_updated'
    | 'plan_changed';
  titulo: string;
  detalhe: string;
  metadata: Record<string, unknown>;
  criado_em: string;
}

export interface UserActivitiesListResponse {
  atividades: UserActivityResponse[];
}

export interface RegisterUserActivityPayload {
  tipo:
    | 'login'
    | 'logout'
    | 'download'
    | 'password_reset_requested'
    | 'password_changed'
    | 'profile_updated'
    | 'plan_changed';
  titulo: string;
  detalhe: string;
  metadata?: Record<string, unknown>;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private backendUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  private async buildAuthHeaders(): Promise<HttpHeaders> {
    const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;

    if (!token) {
      throw new Error('Token de acesso indisponivel.');
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  private withAuthHeaders<T>(requestFactory: (headers: HttpHeaders) => Observable<T>): Observable<T> {
    return from(this.buildAuthHeaders()).pipe(
      switchMap((headers) => requestFactory(headers))
    );
  }

  health(): Observable<{message: string; database: string; timestamp: string}> {
    return this.http.get<{message: string; database: string; timestamp: string}>(
      `${this.backendUrl}/health`
    );
  }

  syncAuth(payload: SyncAuthPayload, token?: string): Observable<SyncAuthResponse> {
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;

    return this.http.post<SyncAuthResponse>(`${this.backendUrl}/auth/sync`, payload, { headers });
  }

  registerEmail(payload: RegisterEmailPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.backendUrl}/auth/register`, payload);
  }

  loginEmail(payload: LoginEmailPayload): Observable<AuthTokenResponse> {
    return this.http.post<AuthTokenResponse>(`${this.backendUrl}/auth/login`, payload);
  }

  verifyEmail(payload: VerifyEmailPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.backendUrl}/auth/verify-email`, payload);
  }

  resendVerification(payload: ResendEmailPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.backendUrl}/auth/resend-verification`,
      payload
    );
  }

  requestPasswordReset(payload: RequestResetPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.backendUrl}/auth/request-password-reset`,
      payload
    );
  }

  sendFirebaseVerificationEmail(
    payload: FirebaseVerificationEmailPayload,
    token: string
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.backendUrl}/auth/firebase/send-verification-email`,
      payload,
      {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`
        })
      }
    );
  }

  resetPassword(payload: ResetPasswordPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.backendUrl}/auth/reset-password`, payload);
  }

  changePassword(payload: ChangePasswordPayload, token: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.backendUrl}/auth/change-password`,
      payload,
      {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`
        })
      }
    );
  }

  getPacksDestaque(limite = 10, busca = ''): Observable<PacksDestaqueResponse> {
    const params = new URLSearchParams({ limite: String(limite) });

    if (busca.trim()) {
      params.set('busca', busca.trim());
    }

    return this.http.get<PacksDestaqueResponse>(`${this.backendUrl}/packs/destaques?${params.toString()}`);
  }

  getAllPacks(busca = ''): Observable<PacksListResponse> {
    const params = busca.trim() ? `?busca=${encodeURIComponent(busca.trim())}` : '';

    return this.http.get<PacksListResponse>(`${this.backendUrl}/packs${params}`);
  }

  getMeusPacks(usuarioId: number, busca = ''): Observable<MeusPacksResponse> {
    void usuarioId;
    const params = busca.trim() ? `?busca=${encodeURIComponent(busca.trim())}` : '';

    return this.withAuthHeaders((headers) =>
      this.http.get<MeusPacksResponse>(`${this.backendUrl}/users/current/library${params}`, { headers })
    );
  }

  getMeuPerfil(usuarioId: number): Observable<UsuarioPerfilResponse> {
    void usuarioId;

    return this.withAuthHeaders((headers) =>
      this.http.get<UsuarioPerfilResponse>(`${this.backendUrl}/users/me/profile`, { headers })
    );
  }

  atualizarMeuPerfil(
    usuarioId: number,
    payload: AtualizarPerfilPayload
  ): Observable<{ message: string; usuario: UsuarioPerfilResponse['usuario'] }> {
    void usuarioId;

    return this.withAuthHeaders((headers) =>
      this.http.put<{ message: string; usuario: UsuarioPerfilResponse['usuario'] }>(
        `${this.backendUrl}/users/me/profile`,
        payload,
        { headers }
      )
    );
  }

  getMyActivities(limite = 10): Observable<UserActivitiesListResponse> {
    return this.withAuthHeaders((headers) =>
      this.http.get<UserActivitiesListResponse>(
        `${this.backendUrl}/users/me/activity?limite=${limite}`,
        { headers }
      )
    );
  }

  registerMyActivity(
    payload: RegisterUserActivityPayload
  ): Observable<{ message: string; atividade: UserActivityResponse }> {
    return this.withAuthHeaders((headers) =>
      this.http.post<{ message: string; atividade: UserActivityResponse }>(
        `${this.backendUrl}/users/me/activity`,
        payload,
        { headers }
      )
    );
  }

  getDownloadsResumo(usuarioId: number, busca = ''): Observable<DownloadsResumoResponse> {
    const params = busca ? `?limite=4&sugestoes=2&busca=${encodeURIComponent(busca)}` : '?limite=4&sugestoes=2';

    void usuarioId;

    return this.withAuthHeaders((headers) =>
      this.http.get<DownloadsResumoResponse>(`${this.backendUrl}/downloads/me${params}`, { headers })
    );
  }

  registrarDownload(usuarioId: number, packId: number): Observable<{ message: string }> {
    void usuarioId;

    return this.withAuthHeaders((headers) =>
      this.http.post<{ message: string }>(
        `${this.backendUrl}/downloads/registrar`,
        { pack_id: packId },
        { headers }
      )
    );
  }

  createCheckout(
    planSlug: PaidPlanSlug,
    terms: { termsAccepted: boolean; termsVersion: string }
  ): Observable<CreateCheckoutResponse> {
    return this.withAuthHeaders((headers) =>
      this.http.post<CreateCheckoutResponse>(
        `${this.backendUrl}/payments/checkout`,
        { planSlug, ...terms },
        { headers }
      )
    );
  }

  syncMercadoPagoReturn(
    providerPaymentId: string,
    externalReference?: string | null
  ): Observable<PaymentStatusResponse> {
    return this.withAuthHeaders((headers) =>
      this.http.post<PaymentStatusResponse>(
        `${this.backendUrl}/payments/mercadopago/return-sync`,
        { providerPaymentId, externalReference },
        { headers }
      )
    );
  }

  getPaymentStatus(paymentId: number): Observable<PaymentStatusResponse> {
    return this.withAuthHeaders((headers) =>
      this.http.get<PaymentStatusResponse>(
        `${this.backendUrl}/payments/me/${paymentId}`,
        { headers }
      )
    );
  }

  sendContact(payload: ContactPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.backendUrl}/contact`, payload);
  }

  getAdminSession(): Observable<{ usuario_id: number; role: 'admin' }> {
    return this.withAuthHeaders((headers) =>
      this.http.get<{ usuario_id: number; role: 'admin' }>(`${this.backendUrl}/admin/me`, { headers })
    );
  }

  getAdminPlans(): Observable<{ planos: AdminPlanoResponse[] }> {
    return this.withAuthHeaders((headers) =>
      this.http.get<{ planos: AdminPlanoResponse[] }>(`${this.backendUrl}/admin/plans`, { headers })
    );
  }

  getAdminPacks(): Observable<{ packs: AdminPackResponse[] }> {
    return this.withAuthHeaders((headers) =>
      this.http.get<{ packs: AdminPackResponse[] }>(`${this.backendUrl}/admin/packs`, { headers })
    );
  }

  getAdminMetrics(): Observable<AdminMetricsResponse> {
    return this.withAuthHeaders((headers) =>
      this.http.get<AdminMetricsResponse>(`${this.backendUrl}/admin/metrics`, { headers })
    );
  }

  getAdminClientAreaContent(): Observable<ClientAreaContentResponse> {
    return this.withAuthHeaders((headers) =>
      this.http.get<ClientAreaContentResponse>(
        `${this.backendUrl}/admin/site-content/client-area`,
        { headers }
      )
    );
  }

  updateAdminClientAreaContent(
    payload: ClientAreaContentResponse
  ): Observable<ClientAreaContentResponse & { message: string }> {
    return this.withAuthHeaders((headers) =>
      this.http.put<ClientAreaContentResponse & { message: string }>(
        `${this.backendUrl}/admin/site-content/client-area`,
        payload,
        { headers }
      )
    );
  }

  createAdminPack(payload: AdminPackPayload): Observable<{ message: string; pack: AdminPackResponse }> {
    return this.withAuthHeaders((headers) =>
      this.http.post<{ message: string; pack: AdminPackResponse }>(
        `${this.backendUrl}/admin/packs`,
        payload,
        { headers }
      )
    );
  }

  updateAdminPack(
    packId: number,
    payload: AdminPackPayload
  ): Observable<{ message: string; pack: AdminPackResponse }> {
    return this.withAuthHeaders((headers) =>
      this.http.put<{ message: string; pack: AdminPackResponse }>(
        `${this.backendUrl}/admin/packs/${packId}`,
        payload,
        { headers }
      )
    );
  }

  sendAdminEmailCampaign(
    payload: AdminEmailCampaignPayload
  ): Observable<AdminEmailCampaignResponse> {
    return this.withAuthHeaders((headers) =>
      this.http.post<AdminEmailCampaignResponse>(
        `${this.backendUrl}/admin/emails/campaigns`,
        payload,
        { headers }
      )
    );
  }

  getAdminEmailRecipientsPreview(
    segment: AdminEmailSegment
  ): Observable<AdminEmailRecipientsPreviewResponse> {
    const params = new URLSearchParams({ segment });

    return this.withAuthHeaders((headers) =>
      this.http.get<AdminEmailRecipientsPreviewResponse>(
        `${this.backendUrl}/admin/emails/recipients?${params.toString()}`,
        { headers }
      )
    );
  }

  getClientAreaContent(): Observable<ClientAreaContentResponse> {
    return this.http.get<ClientAreaContentResponse>(`${this.backendUrl}/content/client-area`);
  }
}
