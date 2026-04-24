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
    provedor_autenticacao: string;
    id_usuario_provedor: string | null;
    foto_url: string | null;
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
  };
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

  getPacksDestaque(limite = 10): Observable<PacksDestaqueResponse> {
    return this.http.get<PacksDestaqueResponse>(`${this.backendUrl}/packs/destaques?limite=${limite}`);
  }

  getAllPacks(): Observable<PacksListResponse> {
    return this.http.get<PacksListResponse>(`${this.backendUrl}/packs`);
  }

  getMeusPacks(usuarioId: number): Observable<MeusPacksResponse> {
    return this.withAuthHeaders((headers) =>
      this.http.get<MeusPacksResponse>(`${this.backendUrl}/users/${usuarioId}/library`, { headers })
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

  sendContact(payload: ContactPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.backendUrl}/contact`, payload);
  }
}
