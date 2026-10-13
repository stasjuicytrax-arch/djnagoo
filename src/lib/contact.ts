import { content } from '@/lib/content'

const { contacts } = content

/** Ссылка WhatsApp с предзаполненным текстом: база и текст живут в content.json. */
export function whatsappUrl(): string {
  return `${contacts.whatsapp}?text=${encodeURIComponent(contacts.whatsappText)}`
}
