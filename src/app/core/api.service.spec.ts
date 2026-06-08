import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { ApiService } from './api.service';
import { auth } from './firebase';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    Object.defineProperty(auth, 'currentUser', {
      configurable: true,
      value: null
    });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    Object.defineProperty(auth, 'currentUser', {
      configurable: true,
      value: null
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('posts syncAuth with the provided bearer token', async () => {
    const responsePromise = firstValueFrom(service.syncAuth({
      nome: 'Joao',
      email: 'joao@example.com',
      provedor_autenticacao: 'firebase',
      id_usuario_provedor: 'firebase-1',
      foto_url: null
    }, 'firebase-sync-token'));

    const req = httpMock.expectOne('http://localhost:3333/auth/sync');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer firebase-sync-token');

    req.flush({
      message: 'ok',
      primeiro_acesso: false,
      usuario: {
        id: '1',
        nome: 'Joao',
        email: 'joao@example.com',
        provedor_autenticacao: 'firebase',
        id_usuario_provedor: 'firebase-1',
        foto_url: null,
        criado_em: '2026-04-01T00:00:00.000Z',
        atualizado_em: '2026-04-01T00:00:00.000Z'
      },
      plano_atual: null
    });

    const response = await responsePromise;
    expect(response.message).toBe('ok');
  });

  it('sends Firebase bearer token when loading the profile', async () => {
    Object.defineProperty(auth, 'currentUser', {
      configurable: true,
      value: {
        getIdToken: jasmine.createSpy('getIdToken').and.resolveTo('firebase-access-token')
      }
    });

    const responsePromise = firstValueFrom(service.getMeuPerfil(7));
    await new Promise((resolve) => setTimeout(resolve, 0));
    const requests = httpMock.match('http://localhost:3333/users/me/profile');
    expect(requests.length).toBe(1);
    const req = requests[0];

    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer firebase-access-token');

    req.flush({
      usuario: {
        id: 7,
        nome: 'Joao Felipe',
        email: 'joao@example.com',
        telefone: '',
        area_atuacao: '',
        foto_url: null,
        criado_em: '2026-04-01T00:00:00.000Z',
        atualizado_em: '2026-04-02T00:00:00.000Z'
      }
    });

    const response = await responsePromise;
    expect(response.usuario.id).toBe(7);
  });

  it('fails authenticated requests when no Firebase token is available', async () => {
    const responsePromise = firstValueFrom(service.getMeusPacks(7));

    await expectAsync(responsePromise).toBeRejectedWithError('Token de acesso indisponivel.');
    httpMock.expectNone('http://localhost:3333/users/me/library');
  });

  it('encodes the search term when requesting downloads', async () => {
    Object.defineProperty(auth, 'currentUser', {
      configurable: true,
      value: {
        getIdToken: jasmine.createSpy('getIdToken').and.resolveTo('firebase-access-token')
      }
    });

    const responsePromise = firstValueFrom(service.getDownloadsResumo(7, 'pack ia'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    const requests = httpMock.match(
      'http://localhost:3333/downloads/me?limite=4&sugestoes=2&busca=pack%20ia'
    );
    expect(requests.length).toBe(1);
    const req = requests[0];

    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer firebase-access-token');

    req.flush({
      total_downloads: 0,
      total_atualizacoes: 0,
      downloads_recentes: [],
      sugestoes: []
    });

    const response = await responsePromise;
    expect(response.total_downloads).toBe(0);
  });

  it('loads admin email recipients preview with auth headers', async () => {
    Object.defineProperty(auth, 'currentUser', {
      configurable: true,
      value: {
        getIdToken: jasmine.createSpy('getIdToken').and.resolveTo('firebase-access-token')
      }
    });

    const responsePromise = firstValueFrom(service.getAdminEmailRecipientsPreview('pro'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    const requests = httpMock.match('http://localhost:3333/admin/emails/recipients?segment=pro');
    expect(requests.length).toBe(1);
    const req = requests[0];

    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer firebase-access-token');

    req.flush({
      segment: 'pro',
      total: 7,
      daily_limit: 100,
      exceeds_daily_limit: false,
      by_plan: [{ plano_slug: 'pro', total: 7 }]
    });

    const response = await responsePromise;
    expect(response.total).toBe(7);
    expect(response.by_plan[0].plano_slug).toBe('pro');
  });

  it('posts contact messages without auth headers', async () => {
    const responsePromise = firstValueFrom(service.sendContact({
      nome: 'Joao',
      email: 'joao@example.com',
      telefone: '16999999999',
      assunto: 'duvida',
      mensagem: 'Preciso de ajuda com meu acesso.'
    }));

    const req = httpMock.expectOne('http://localhost:3333/contact');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.has('Authorization')).toBeFalse();

    req.flush({ message: 'Mensagem enviada com sucesso.' });

    const response = await responsePromise;
    expect(response.message).toContain('sucesso');
  });
});
