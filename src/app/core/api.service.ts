import { Injectable, Optional } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SyncAuthPayload {
  nome: string | null;
  email: string | null;
  provedor_autenticacao: string;
  id_usuario_provedor: string;
  foto_url: string | null;
}

export interface PlanoAtualResponse {
  id: string;
  slug: 'gratuito' | 'basic' | 'gold' | 'premium';
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
    slug: 'gratuito' | 'basic' | 'gold' | 'premium';
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

  constructor(@Optional() private http: HttpClient | null) { }

  private hasHttpClient(): boolean {
    return !!this.http;
  }

  private getFallbackDownloadsResumo(): DownloadsResumoResponse {
    return {
      total_downloads: 1,
      total_atualizacoes: 0,
      downloads_recentes: [
        {
          id: 2,
          slug: 'pack-ia',
          nome: 'Pack IA',
          descricao: 'Coleção com assets modernos para criadores e conteúdos virais.',
          capa_url: null,
          tamanho_gb: '8.9',
          versao_atual: '2.8',
          versao_baixada: '2.8',
          baixado_em: '2026-04-01T18:11:00.000Z',
          possui_atualizacao: false
        }
      ],
      sugestoes: [
        {
          id: 1,
          slug: 'emojis',
          nome: 'Emojis',
          descricao: 'Biblioteca leve para enriquecer cortes rápidos, shorts e reels.',
          capa_url: null,
          tamanho_gb: '1.1',
          versao_atual: '1.6',
          versao_baixada: '1.6',
          baixado_em: '2026-04-01T18:11:00.000Z',
          possui_atualizacao: false
        }
      ]
    };
  }

  private getFallbackPerfil(): UsuarioPerfilResponse {
    return {
      usuario: {
        id: 1,
        nome: 'João Felipe',
        email: 'joao@example.com',
        telefone: '(16) 99999-9999',
        area_atuacao: 'Editor / Creator',
        foto_url: null,
        criado_em: '2026-03-01T00:00:00.000Z',
        atualizado_em: '2026-04-01T00:00:00.000Z'
      }
    };
  }

  health(): Observable<{message: string; database: string; timestamp: string}> {
    if (!this.hasHttpClient()) {
      return of({
        message: 'ok',
        database: 'mock',
        timestamp: new Date().toISOString()
      });
    }

    return this.http!.get<{message: string; database: string; timestamp: string}>(
      `${this.backendUrl}/health`
    );
  }

  syncAuth(payload: SyncAuthPayload): Observable<SyncAuthResponse> {
    if (!this.hasHttpClient()) {
      return throwError(() => new Error('HttpClient indisponível.'));
    }

    return this.http!.post<SyncAuthResponse>(`${this.backendUrl}/auth/sync`, payload);
  }

  registerEmail(payload: RegisterEmailPayload): Observable<{ message: string }> {
    if (!this.hasHttpClient()) {
      return throwError(() => new Error('HttpClient indisponível.'));
    }

    return this.http!.post<{ message: string }>(`${this.backendUrl}/auth/register`, payload);
  }

  loginEmail(payload: LoginEmailPayload): Observable<AuthTokenResponse> {
    if (!this.hasHttpClient()) {
      return throwError(() => new Error('HttpClient indisponível.'));
    }

    return this.http!.post<AuthTokenResponse>(`${this.backendUrl}/auth/login`, payload);
  }

  verifyEmail(payload: VerifyEmailPayload): Observable<{ message: string }> {
    if (!this.hasHttpClient()) {
      return throwError(() => new Error('HttpClient indisponível.'));
    }

    return this.http!.post<{ message: string }>(`${this.backendUrl}/auth/verify-email`, payload);
  }

  resendVerification(payload: ResendEmailPayload): Observable<{ message: string }> {
    if (!this.hasHttpClient()) {
      return throwError(() => new Error('HttpClient indisponível.'));
    }

    return this.http!.post<{ message: string }>(
      `${this.backendUrl}/auth/resend-verification`,
      payload
    );
  }

  requestPasswordReset(payload: RequestResetPayload): Observable<{ message: string }> {
    if (!this.hasHttpClient()) {
      return throwError(() => new Error('HttpClient indisponível.'));
    }

    return this.http!.post<{ message: string }>(
      `${this.backendUrl}/auth/request-password-reset`,
      payload
    );
  }

  resetPassword(payload: ResetPasswordPayload): Observable<{ message: string }> {
    if (!this.hasHttpClient()) {
      return throwError(() => new Error('HttpClient indisponível.'));
    }

    return this.http!.post<{ message: string }>(`${this.backendUrl}/auth/reset-password`, payload);
  }

  changePassword(payload: ChangePasswordPayload, token: string): Observable<{ message: string }> {
    if (!this.hasHttpClient()) {
      return throwError(() => new Error('HttpClient indisponível.'));
    }

    return this.http!.post<{ message: string }>(
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
    if (!this.hasHttpClient()) {
      return throwError(() => new Error('HttpClient indisponível.'));
    }

    return this.http!.get<PacksDestaqueResponse>(`${this.backendUrl}/packs/destaques?limite=${limite}`);
  }

  getAllPacks(): Observable<PacksListResponse> {
    if (!this.hasHttpClient()) {
      return throwError(() => new Error('HttpClient indisponível.'));
    }

    return this.http!.get<PacksListResponse>(`${this.backendUrl}/packs`);
  }

  getMeusPacks(usuarioId: number): Observable<MeusPacksResponse> {
    if (!this.hasHttpClient()) {
      return throwError(() => new Error('HttpClient indisponível.'));
    }

    const token = localStorage.getItem('nicol_auth_token');
    const headers = new HttpHeaders(
      token
        ? { Authorization: `Bearer ${token}` }
        : { 'x-usuario-id': String(usuarioId) }
    );

    return this.http!.get<MeusPacksResponse>(`${this.backendUrl}/usuarios/me/packs`, { headers });
  }

  getMeuPerfil(usuarioId: number): Observable<UsuarioPerfilResponse> {
    if (!this.hasHttpClient()) {
      return of(this.getFallbackPerfil());
    }

    return this.http!.get<UsuarioPerfilResponse>(`${this.backendUrl}/usuarios/me/perfil`, {
      headers: new HttpHeaders({
        'x-usuario-id': String(usuarioId)
      })
    });
  }

  atualizarMeuPerfil(
    usuarioId: number,
    payload: AtualizarPerfilPayload
  ): Observable<{ message: string; usuario: UsuarioPerfilResponse['usuario'] }> {
    if (!this.hasHttpClient()) {
      return of({
        message: 'Perfil atualizado com sucesso.',
        usuario: {
          ...this.getFallbackPerfil().usuario,
          nome: payload.nome,
          email: payload.email,
          telefone: payload.telefone,
          area_atuacao: payload.area_atuacao
        }
      });
    }

    return this.http!.put<{ message: string; usuario: UsuarioPerfilResponse['usuario'] }>(
      `${this.backendUrl}/usuarios/me/perfil`,
      payload,
      {
        headers: new HttpHeaders({
          'x-usuario-id': String(usuarioId)
        })
      }
    );
  }

  getDownloadsResumo(usuarioId: number, busca = ''): Observable<DownloadsResumoResponse> {
    if (!this.hasHttpClient()) {
      return of(this.getFallbackDownloadsResumo());
    }

    const params = busca ? `?limite=4&sugestoes=2&busca=${encodeURIComponent(busca)}` : '?limite=4&sugestoes=2';

    return this.http!.get<DownloadsResumoResponse>(`${this.backendUrl}/downloads/me${params}`, {
      headers: new HttpHeaders({
        'x-usuario-id': String(usuarioId)
      })
    });
  }

  registrarDownload(usuarioId: number, packId: number): Observable<{ message: string }> {
    if (!this.hasHttpClient()) {
      return of({ message: 'Download registrado.' });
    }

    return this.http!.post<{ message: string }>(
      `${this.backendUrl}/downloads/registrar`,
      { pack_id: packId },
      {
        headers: new HttpHeaders({
          'x-usuario-id': String(usuarioId)
        })
      }
    );
  }
}
