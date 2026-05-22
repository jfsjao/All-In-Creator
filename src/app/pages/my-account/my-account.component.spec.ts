import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { MyAccountComponent } from './my-account.component';
import { ApiService } from '@core/api.service';
import { AuthService } from '@core/services/auth.service';
import { SafeToastrService } from '@core/services/safe-toastr.service';

describe('MyAccountComponent', () => {
  let component: MyAccountComponent;
  let fixture: ComponentFixture<MyAccountComponent>;

  const authServiceMock = {
    currentUser: jasmine.createSpy('currentUser').and.returnValue({
      backendUserId: 7,
      displayName: 'Joao Felipe',
      email: 'joao@example.com'
    }),
    waitForAuthInit: jasmine.createSpy('waitForAuthInit').and.resolveTo(),
    resetPassword: jasmine.createSpy('resetPassword').and.resolveTo(true),
    updateCurrentUserProfile: jasmine.createSpy('updateCurrentUserProfile').and.resolveTo()
  };

  const apiServiceMock = {
    getMeuPerfil: jasmine.createSpy('getMeuPerfil').and.returnValue(of({
      usuario: {
        id: 7,
        nome: 'Joao Felipe',
        email: 'joao@example.com',
        telefone: '16999999999',
        area_atuacao: 'Editor',
        foto_url: null,
        criado_em: '2026-03-01T00:00:00.000Z',
        atualizado_em: '2026-04-01T00:00:00.000Z'
      }
    })),
    getMyActivities: jasmine.createSpy('getMyActivities').and.returnValue(of({
      atividades: [
        {
          id: 1,
          usuario_id: 7,
          tipo: 'download',
          titulo: 'Download concluído',
          detalhe: 'Pack IA foi baixado com sucesso.',
          metadata: {},
          criado_em: '2026-04-01T18:11:00.000Z'
        }
      ]
    })),
    atualizarMeuPerfil: jasmine.createSpy('atualizarMeuPerfil')
  };

  const safeToastrMock = {
    success: jasmine.createSpy('success'),
    error: jasmine.createSpy('error'),
    warning: jasmine.createSpy('warning'),
    info: jasmine.createSpy('info')
  };

  beforeEach(async () => {
    authServiceMock.currentUser.calls.reset();
    authServiceMock.waitForAuthInit.calls.reset();
    authServiceMock.resetPassword.calls.reset();
    authServiceMock.updateCurrentUserProfile.calls.reset();
    authServiceMock.currentUser.and.returnValue({
      backendUserId: 7,
      displayName: 'Joao Felipe',
      email: 'joao@example.com'
    });

    apiServiceMock.getMeuPerfil.calls.reset();
    apiServiceMock.getMyActivities.calls.reset();
    apiServiceMock.atualizarMeuPerfil.calls.reset();

    await TestBed.configureTestingModule({
      imports: [MyAccountComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: ApiService, useValue: apiServiceMock },
        { provide: SafeToastrService, useValue: safeToastrMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MyAccountComponent);
    component = fixture.componentInstance;
  });

  it('loads profile data from the API for a synced user', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(apiServiceMock.getMeuPerfil).toHaveBeenCalledWith(7);
    expect(apiServiceMock.getMyActivities).toHaveBeenCalledWith(6);
    expect(component.hasLoadError).toBeFalse();
    expect(component.profileForm.name).toBe('Joao Felipe');
    expect(component.profileForm.role).toBe('Editor');
    expect(component.recentActivity.length).toBeGreaterThan(0);
  });

  it('keeps the auth user data and surfaces an error when backend sync is missing', async () => {
    authServiceMock.currentUser.and.returnValue({
      backendUserId: null,
      displayName: 'Joao Firebase',
      email: 'firebase@example.com'
    });

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(apiServiceMock.getMeuPerfil).not.toHaveBeenCalled();
    expect(component.hasLoadError).toBeTrue();
    expect(component.profileForm.name).toBe('Joao Firebase');
    expect(component.profileForm.email).toBe('firebase@example.com');
  });

  it('updates the auth profile snapshot after saving a new name', async () => {
    apiServiceMock.atualizarMeuPerfil.and.returnValue(of({
      message: 'Perfil atualizado com sucesso.',
      usuario: {
        id: 7,
        nome: 'Joao Criador',
        email: 'joao@example.com',
        telefone: '16999999999',
        area_atuacao: 'Editor',
        foto_url: null,
        criado_em: '2026-03-01T00:00:00.000Z',
        atualizado_em: '2026-04-01T00:00:00.000Z'
      }
    }));

    fixture.detectChanges();
    await fixture.whenStable();

    component.profileForm.name = 'Joao Criador';
    await component.salvarPerfil();

    expect(apiServiceMock.atualizarMeuPerfil).toHaveBeenCalled();
    expect(authServiceMock.updateCurrentUserProfile).toHaveBeenCalledWith({
      displayName: 'Joao Criador'
    });
  });
});
