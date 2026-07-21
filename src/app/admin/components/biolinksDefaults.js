// Valores padrão e catálogos usados por BiolinksManager.js/BiolinksBlockModal.js/BiolinksSettingsModal.js.
export const BLOCK_TYPES = [
  { type: 'avatar', label: 'Avatar/Foto de Perfil', icon: 'fa-user' },
  { type: 'heading', label: 'Título/Cabeçalho', icon: 'fa-heading' },
  { type: 'paragraph', label: 'Parágrafo/Texto', icon: 'fa-paragraph' },
  { type: 'link', label: 'Botão de Link Externo', icon: 'fa-link' },
  { type: 'phone_collector', label: 'Captador de WhatsApp', icon: 'fa-phone' },
];

export const FONTS_LIST = [
  { value: 'var(--font-sans)', label: 'Sans-Serif Padrão' },
  { value: 'var(--font-serif)', label: 'Serif Elegante' },
  { value: 'Inter, sans-serif', label: 'Inter (Moderna)' },
  { value: 'Playfair Display, serif', label: 'Playfair (Clássica)' },
  { value: 'Outfit, sans-serif', label: 'Outfit (Premium)' },
];

export const emptyBio = () => ({
  slug: '',
  title: '',
  description: '',
  background_type: 'gradient',
  background_color_one: '#0F0D09',
  background_color_two: '#7F6346',
  background_image: '',
  text_color: '#ffffff',
  font: 'var(--font-sans)',
  display_branding: true,
  branding_name: '',
  branding_url: '',
  custom_css: '',
  custom_js: '',
});

export function defaultBlockSettings(type) {
  switch (type) {
    case 'link':
      return {
        name: '',
        background_color: '#ffffff',
        text_color: '#000000',
        open_in_new_tab: true,
        border_radius: 'round',
        border_width: 0,
        border_style: 'solid',
        border_color: '#000000',
        border_shadow_offset_x: 0,
        border_shadow_offset_y: 6,
        border_shadow_blur: 20,
        border_shadow_spread: 0,
        border_shadow_color: '#00000015',
        animation: 'false',
        image: '',
      };
    case 'avatar':
      return {
        image: '',
        size: 96,
        border_radius: 'round',
        border_width: 0,
        border_style: 'solid',
        border_color: '#ffffff',
        border_shadow_offset_x: 0,
        border_shadow_offset_y: 4,
        border_shadow_blur: 15,
        border_shadow_color: '#00000030',
      };
    case 'heading':
      return { text: '', heading_type: 'h2', text_color: '#ffffff' };
    case 'paragraph':
      return { text: '', text_color: '#d7b994' };
    case 'phone_collector':
      return { name: 'Promoções no WhatsApp', button_text: 'Quero Participar', name_placeholder: 'Seu Nome', phone_placeholder: 'Seu WhatsApp' };
    default:
      return {};
  }
}

export const emptyBlock = () => ({ type: 'link', location_url: '', settings: defaultBlockSettings('link'), sort_order: 0, is_enabled: true });
