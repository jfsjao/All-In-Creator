import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { AdminComponent } from './admin.component';
import { ApiService } from '@core/api.service';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;

  const apiServiceMock = {
    getAdminPlans: jasmine.createSpy('getAdminPlans'),
    getAdminPacks: jasmine.createSpy('getAdminPacks'),
    getAdminMetrics: jasmine.createSpy('getAdminMetrics'),
    getAdminClientAreaContent: jasmine.createSpy('getAdminClientAreaContent'),
    getAdminEmailRecipientsPreview: jasmine.createSpy('getAdminEmailRecipientsPreview'),
    updateAdminClientAreaContent: jasmine.createSpy('updateAdminClientAreaContent'),
    sendAdminEmailCampaign: jasmine.createSpy('sendAdminEmailCampaign'),
    createAdminPack: jasmine.createSpy('createAdminPack'),
    updateAdminPack: jasmine.createSpy('updateAdminPack')
  };

  const toastrMock = {
    success: jasmine.createSpy('success'),
    error: jasmine.createSpy('error'),
    warning: jasmine.createSpy('warning'),
    info: jasmine.createSpy('info')
  };

  beforeEach(async () => {
    apiServiceMock.getAdminPlans.and.returnValue(of({
      planos: [
        { id: 1, slug: 'gratuito', nome: 'Gratuito', descricao: null, preco: '0.00', ativo: true, total_packs: 4 },
        { id: 2, slug: 'basic', nome: 'Basico', descricao: null, preco: '29.90', ativo: true, total_packs: 14 }
      ]
    }));
    apiServiceMock.getAdminPacks.and.returnValue(of({ packs: [] }));
    apiServiceMock.getAdminMetrics.and.returnValue(of({
      usuarios_por_area: [],
      packs_mais_baixados: [],
      packs_mais_baixados_por_area: []
    }));
    apiServiceMock.getAdminClientAreaContent.and.returnValue(of({
      slides: [],
      news: [],
      has_configured_content: false
    }));
    apiServiceMock.getAdminEmailRecipientsPreview.and.returnValue(of({
      segment: 'all',
      total: 12,
      daily_limit: 100,
      exceeds_daily_limit: false,
      by_plan: [
        { plano_slug: 'gratuito', total: 5 },
        { plano_slug: 'pro', total: 7 }
      ]
    }));
    apiServiceMock.updateAdminClientAreaContent.and.returnValue(of({
      message: 'Conteudos atualizados com sucesso.',
      slides: [],
      news: [],
      has_configured_content: true
    }));
    apiServiceMock.sendAdminEmailCampaign.and.returnValue(of({
      message: 'Campanha enviada com sucesso.',
      sent: 1,
      total: 1,
      segment: 'all',
      test: false
    }));

    Object.values(apiServiceMock).forEach((spy) => spy.calls?.reset());
    Object.values(toastrMock).forEach((spy) => spy.calls?.reset());

    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceMock },
        { provide: ToastrService, useValue: toastrMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
  });

  it('carrega planos, packs e preview de destinatarios do admin', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(apiServiceMock.getAdminPlans).toHaveBeenCalled();
    expect(apiServiceMock.getAdminPacks).toHaveBeenCalled();
    expect(apiServiceMock.getAdminEmailRecipientsPreview).toHaveBeenCalledWith('all');
    expect(component.emailRecipientsPreview?.total).toBe(12);
    expect(component.planos.length).toBe(2);
  });

  it('restaura slides padrao sem apagar customizados e desativa extras', () => {
    component.contentSlides = [
      {
        chave: 'client-slide-novidades',
        titulo: 'Titulo editado',
        subtitulo: 'Texto editado',
        ativo: false,
        ordem: 0,
        image: 'assets/editado.webp',
        alt: 'Editado',
        tag: 'Editado',
        buttonText: 'Abrir',
        buttonLink: '/library'
      },
      {
        chave: 'client-slide-custom',
        titulo: 'Custom',
        subtitulo: 'Custom',
        ativo: true,
        ordem: 1,
        image: 'assets/custom.webp',
        alt: 'Custom',
        tag: 'Custom',
        buttonText: 'Abrir',
        buttonLink: '/library'
      }
    ];

    component.restoreDefaultSlides();

    expect(component.contentSlides.length).toBe(4);
    expect(component.contentSlides[0].chave).toBe('client-slide-novidades');
    expect(component.contentSlides[0].ativo).toBeTrue();
    expect(component.contentSlides[0].titulo).toContain('ultimas atualizacoes');

    const custom = component.contentSlides.find((slide) => slide.chave === 'client-slide-custom');
    expect(custom?.ativo).toBeFalse();
    expect(custom?.ordem).toBe(3);
  });

  it('restaura noticias padrao sem apagar customizadas e desativa extras', () => {
    component.contentNews = [
      {
        chave: 'client-news-custom',
        titulo: 'Custom',
        subtitulo: 'Custom',
        ativo: true,
        ordem: 0,
        tag: 'Custom',
        date: '01/06/2026'
      }
    ];

    component.restoreDefaultNews();

    expect(component.contentNews.length).toBe(4);
    expect(component.contentNews[0].chave).toBe('client-news-novos-templates');
    expect(component.contentNews[0].ativo).toBeTrue();
    expect(component.contentNews.find((item) => item.chave === 'client-news-custom')?.ativo).toBeFalse();
  });

  it('desativa todos os slides e noticias sem remover itens', () => {
    component.contentSlides = [
      {
        chave: 'slide-1',
        titulo: 'Slide',
        subtitulo: 'Texto',
        ativo: true,
        ordem: 0,
        image: 'assets/slide.webp',
        alt: 'Slide',
        tag: 'Slide',
        buttonText: 'Abrir',
        buttonLink: '/library'
      }
    ];
    component.contentNews = [
      {
        chave: 'news-1',
        titulo: 'Noticia',
        subtitulo: 'Texto',
        ativo: true,
        ordem: 0,
        tag: 'Novidade',
        date: '01/06/2026'
      }
    ];

    component.deactivateAllSlides();
    component.deactivateAllNews();

    expect(component.contentSlides).toHaveSize(1);
    expect(component.contentSlides.every((slide) => !slide.ativo)).toBeTrue();
    expect(component.contentNews).toHaveSize(1);
    expect(component.contentNews.every((item) => !item.ativo)).toBeTrue();
  });

  it('atualiza preview de destinatarios quando o segmento muda', async () => {
    component.emailForm.patchValue({ segment: 'pro' });
    apiServiceMock.getAdminEmailRecipientsPreview.and.returnValue(of({
      segment: 'pro',
      total: 7,
      daily_limit: 5,
      exceeds_daily_limit: true,
      by_plan: [{ plano_slug: 'pro', total: 7 }]
    }));

    await component.loadEmailRecipientsPreview();

    expect(apiServiceMock.getAdminEmailRecipientsPreview).toHaveBeenCalledWith('pro');
    expect(component.emailRecipientsPreview?.total).toBe(7);
    expect(component.emailRecipientsPreview?.exceeds_daily_limit).toBeTrue();
  });
});
