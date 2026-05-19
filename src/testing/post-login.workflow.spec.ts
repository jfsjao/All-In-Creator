import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../app/core/api.service';
import { AuthService } from '../app/core/services/auth.service';
import { UserLibraryService } from '../app/core/services/user-library.service';
import { MyAccountComponent } from '../app/pages/my-account/my-account.component';
import { ClientAreaComponent } from '../app/pages/client-area/client-area.component';
import { MyDownloadsComponent } from '../app/pages/my-downloads/my-downloads.component';
import { LibraryComponent } from '../app/pages/library/library.component';

describe('Post Login Workflow', () => {
  const toastrMock = jasmine.createSpyObj<ToastrService>('ToastrService', [
    'success',
    'error',
    'info',
    'warning'
  ]);

  const authServiceMock = {
    currentUser: jasmine.createSpy('currentUser').and.returnValue({
      backendUserId: 7,
      uid: 'user-1',
      email: 'joao@example.com',
      displayName: 'JoÃ£o Felipe',
      photoURL: null,
      plano: 'basic'
    }),
    isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(true),
    waitForAuthInit: jasmine.createSpy('waitForAuthInit').and.resolveTo()
  };

  const userLibraryServiceMock = {
    loadUserLibrary: jasmine.createSpy('loadUserLibrary').and.returnValue(of({
      userId: 7,
      plan: {
        slug: 'basic',
        nome: 'Plano Basic',
        status: 'ativo'
      },
      ownedPacks: [
        {
          id: 1,
          title: 'Emojis',
          description: 'Biblioteca de emojis',
          image: 'assets/images/packs/emojis.webp',
          badge: 'Liberado',
          locked: false,
          link: '/library',
          downloadUrl: null
        }
      ],
      featuredPacks: [],
      noveltyPacks: [],
      allPacks: [
        {
          id: 1,
          title: 'Emojis',
          description: 'Biblioteca de emojis',
          image: 'assets/images/packs/emojis.webp',
          badge: 'Liberado',
          locked: false,
          link: '/library',
          downloadUrl: null
        }
      ],
      upgradePacks: [],
      popularPacks: [
        {
          id: 1,
          title: 'Emojis',
          description: 'Biblioteca de emojis',
          image: 'assets/images/packs/emojis.webp',
          badge: 'Liberado',
          locked: false,
          link: '/library',
          downloadUrl: null
        }
      ]
    }))
  };

  const apiServiceMock = {
    getDownloadsResumo: jasmine.createSpy('getDownloadsResumo').and.returnValue(of({
      total_downloads: 1,
      total_atualizacoes: 0,
      downloads_recentes: [
        {
          id: 2,
          slug: 'pack-ia',
          nome: 'Pack IA',
          descricao: 'ColeÃ§Ã£o com assets modernos para criadores e conteÃºdos virais.',
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
          descricao: 'Biblioteca leve para enriquecer cortes rÃ¡pidos, shorts e reels.',
          capa_url: null,
          tamanho_gb: '1.1',
          versao_atual: '1.6',
          versao_baixada: '1.6',
          baixado_em: '2026-04-01T18:11:00.000Z',
          possui_atualizacao: false
        }
      ]
    })),
    getMeuPerfil: jasmine.createSpy('getMeuPerfil').and.returnValue(of({
      usuario: {
        id: 7,
        nome: 'JoÃ£o Felipe',
        email: 'joao@example.com',
        telefone: '',
        area_atuacao: '',
        foto_url: null,
        criado_em: '2026-03-01T00:00:00.000Z',
        atualizado_em: '2026-04-01T00:00:00.000Z'
      }
    })),
    atualizarMeuPerfil: jasmine.createSpy('atualizarMeuPerfil').and.returnValue(of({
      message: 'Perfil atualizado com sucesso.',
      usuario: {
        id: 7,
        nome: 'JoÃ£o Felipe',
        email: 'joao@example.com',
        telefone: '',
        area_atuacao: '',
        foto_url: null,
        criado_em: '2026-03-01T00:00:00.000Z',
        atualizado_em: '2026-04-01T00:00:00.000Z'
      }
    }))
  };

  function configure(component: unknown) {
    return TestBed.configureTestingModule({
      imports: [component as never],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: UserLibraryService, useValue: userLibraryServiceMock },
        { provide: ApiService, useValue: apiServiceMock },
        { provide: ToastrService, useValue: toastrMock }
      ]
    }).compileComponents();
  }

  it('renders dashboard data for authenticated users', async () => {
    await configure(ClientAreaComponent);

    const fixture = TestBed.createComponent(ClientAreaComponent);
    const component = fixture.componentInstance;
    spyOn<any>(component, 'startAutoSlide').and.stub();
    fixture.detectChanges();
    await (component as any).handlePaymentReturn();
    fixture.detectChanges();

    expect(component.userName).toBe('JoÃ£o Felipe');
    expect(component.myPacks.length).toBeGreaterThan(0);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Bem-vindo de volta');
  });

  it('filters downloads by the search term', async () => {
    await configure(MyDownloadsComponent);

    const fixture = TestBed.createComponent(MyDownloadsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component.searchTerm = 'Pack IA';

    expect(component.filteredRecentDownloads.length).toBe(1);
    expect(component.filteredRecentDownloads[0].title).toContain('IA');
  });

  it('prefills account data with the authenticated user info', async () => {
    await configure(MyAccountComponent);

    const fixture = TestBed.createComponent(MyAccountComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.profileForm.name).toBe('JoÃ£o Felipe');
    expect(component.profileForm.email).toBe('joao@example.com');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('JoÃ£o Felipe');
  });

  it('filters packs using the search box logic', async () => {
    await configure(LibraryComponent);

    const fixture = TestBed.createComponent(LibraryComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component.searchTerm = 'emoji';

    expect(component.filterPacks(component.myPacks).length).toBe(1);
    expect(component.filterPacks(component.myPacks)[0].title).toBe('Emojis');
  });
});



