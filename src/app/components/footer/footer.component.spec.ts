import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';
import { ToastrService } from 'ngx-toastr';
import { ClipboardService } from '../../core/services/clipboard/clipboard.service';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let clipboardSpy: jasmine.SpyObj<ClipboardService>;

  beforeEach(async () => {
    toastrSpy = jasmine.createSpyObj('ToastrService', ['error']);
    clipboardSpy = jasmine.createSpyObj('ClipboardService', ['copyToClipboard']);

    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [
        { provide: ToastrService, useValue: toastrSpy },
        { provide: ClipboardService, useValue: clipboardSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('copyContact', () => {
    it('should handle successful copy', async () => {
      const mockEvent = { preventDefault: jasmine.createSpy() } as unknown as MouseEvent;
      clipboardSpy.copyToClipboard.and.returnValue(Promise.resolve(true));

      await component.copyContact('test@example.com', 'email', mockEvent);

      expect(component.showNotification).toBeTrue();
      expect(component.notificationMessage).toBe('Email copiado!');
      expect(component.copiedItemType).toBe('email');
    });

    it('should handle copy failure', async () => {
      const mockEvent = { preventDefault: jasmine.createSpy() } as unknown as MouseEvent;
      clipboardSpy.copyToClipboard.and.returnValue(Promise.resolve(false));

      await component.copyContact('test@example.com', 'email', mockEvent);

      expect(toastrSpy.error).toHaveBeenCalledWith('Falha ao copiar para a área de transferência');
    });
  });
});