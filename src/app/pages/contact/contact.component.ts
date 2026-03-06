import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ClipboardService } from '../../core/services/clipboard/clipboard.service';
import { ToastrService } from 'ngx-toastr';

type CopiedItemType = 'email' | 'phone' | 'instagram' | null;
type SubjectType = '' | 'orcamento' | 'duvida' | 'parceria' | 'agendamento';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: SubjectType;
  message: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  private clipboard = inject(ClipboardService);
  private toastr = inject(ToastrService);

  showNotification = false;
  notificationMessage = '';
  copiedItemType: CopiedItemType = null;

  isSubmitting = false;

  contactInfo: ContactFormData = this.getEmptyForm();

  private getEmptyForm(): ContactFormData {
    return {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    };
  }

  async copyContact(
    value: string,
    type: Exclude<CopiedItemType, null>,
    event: MouseEvent
  ): Promise<void> {
    event.preventDefault();
    this.showNotification = false;

    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      const success = await this.clipboard.copyToClipboard(value);

      if (!success) {
        this.toastr.error('Falha ao copiar para a área de transferência.');
        return;
      }

      this.copiedItemType = type;
      this.notificationMessage =
        type === 'email'
          ? 'Email copiado!'
          : type === 'phone'
          ? 'Telefone copiado!'
          : 'Instagram copiado!';

      this.showNotification = true;

      setTimeout(() => {
        this.showNotification = false;
        this.copiedItemType = null;
      }, 2200);
    } catch {
      this.toastr.error('Erro inesperado ao copiar.');
    }
  }

  scrollToForm(): void {
    const formSection = document.getElementById('contact-form');

    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  async submitForm(form: NgForm): Promise<void> {
    if (this.isSubmitting) return;

    if (form.invalid || !this.isFormValid()) {
      form.control.markAllAsTouched();
      this.toastr.warning('Revise os campos obrigatórios antes de enviar.');
      return;
    }

    this.isSubmitting = true;

    try {
      const payload = {
        ...this.contactInfo,
        phone: this.normalizePhone(this.contactInfo.phone),
        createdAt: new Date().toISOString()
      };

      console.log('Form submitted:', payload);

      await new Promise(resolve => setTimeout(resolve, 1200));

      this.toastr.success('Formulário enviado com sucesso!');
      this.contactInfo = this.getEmptyForm();
      form.resetForm(this.getEmptyForm());
    } catch {
      this.toastr.error('Não foi possível enviar sua mensagem. Tente novamente.');
    } finally {
      this.isSubmitting = false;
    }
  }

  private isFormValid(): boolean {
    const nameValid = this.contactInfo.name.trim().length >= 3;
    const emailValid = this.isValidEmail(this.contactInfo.email);
    const phoneValid = this.normalizePhone(this.contactInfo.phone).length >= 10;
    const subjectValid = this.contactInfo.subject !== '';
    const messageValid = this.contactInfo.message.trim().length >= 10;

    return nameValid && emailValid && phoneValid && subjectValid && messageValid;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }
}