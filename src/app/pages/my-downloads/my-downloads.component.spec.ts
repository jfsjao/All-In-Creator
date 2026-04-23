import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { MyDownloadsComponent } from './my-downloads.component';
import { ApiService } from '@core/api.service';
import { AuthService } from '@core/services/auth.service';

describe('MyDownloadsComponent', () => {
  let component: MyDownloadsComponent;
  let fixture: ComponentFixture<MyDownloadsComponent>;

  const apiServiceMock = {
    getDownloadsResumo: jasmine.createSpy('getDownloadsResumo').and.returnValue(of({
      total_downloads: 1,
      total_atualizacoes: 0,
      downloads_recentes: [
        {
          id: 1,
          slug: 'pack-ia',
          nome: 'Pack IA',
          descricao: 'Assets e conteudos virais.',
          capa_url: null,
          tamanho_gb: '8.9',
          versao_atual: '2.8',
          versao_baixada: '2.8',
          baixado_em: '2026-04-01T18:11:00.000Z',
          possui_atualizacao: false
        }
      ],
      sugestoes: []
    }))
  };

  const authServiceMock = {
    currentUser: jasmine.createSpy('currentUser').and.returnValue({
      backendUserId: 7
    }),
    waitForAuthInit: jasmine.createSpy('waitForAuthInit').and.resolveTo()
  };

  beforeEach(async () => {
    apiServiceMock.getDownloadsResumo.calls.reset();
    authServiceMock.currentUser.calls.reset();
    authServiceMock.waitForAuthInit.calls.reset();
    authServiceMock.currentUser.and.returnValue({ backendUserId: 7 });

    await TestBed.configureTestingModule({
      imports: [MyDownloadsComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceMock },
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MyDownloadsComponent);
    component = fixture.componentInstance;
  });

  it('loads downloads for a synced user', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(apiServiceMock.getDownloadsResumo).toHaveBeenCalledWith(7, '');
    expect(component.hasError).toBeFalse();
    expect(component.totalDownloads).toBe(1);
    expect(component.recentDownloads.length).toBe(1);
  });

  it('shows an error state when the backend user is missing', async () => {
    authServiceMock.currentUser.and.returnValue(null);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(apiServiceMock.getDownloadsResumo).not.toHaveBeenCalled();
    expect(component.hasError).toBeTrue();
    expect(component.totalDownloads).toBe(0);
    expect(component.recentDownloads.length).toBe(0);
  });
});
