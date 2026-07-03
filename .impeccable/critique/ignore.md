# Impeccable Critique — Ignore List

## Design-System Exceptions (Intentional)

### WhatsApp Brand Green (#25D366)
- **Pattern**: `#25D366`
- **Reason**: Official WhatsApp brand color. Used only on `<i class="fa-brands fa-whatsapp">` icon glyphs throughout the site. Required to match WhatsApp's brand identity guidelines. Now managed via `var(--whatsapp)` token in `globals.css`.
- **Files**: `layout.js`, `page.js`, and any other page that shows a WhatsApp CTA link.

### Wine Score Badge Metallic Gradient
- **Pattern**: `#fbf5b7`, `#daaf52`, `#aa771c`, `#f2d893`, `#b38728`
- **Reason**: These colors are part of a single intentional metallic gold gradient (`linear-gradient(135deg, #b38728 0%, #fbf5b7 25%, #daaf52 50%, #fbf5b7 75%, #aa771c 100%)`) used exclusively on `.wine-score-badge` and `.wine-score-badge-secondary` components in `globals.css`. They produce a premium metallic sheen for wine critic score medallions. This is a brand-specific design detail, not palette drift.
- **Files**: `src/app/globals.css` (lines ~1248 and ~1271)
