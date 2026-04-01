---
title: Internationalization (i18n)
description: Arabic/English translation system with RTL support
---

# Internationalization (i18n)

## Configuration

**Source:** `frontend/src/i18n/config.ts`

| Setting | Value |
|---------|-------|
| Supported locales | `ar` (Arabic), `en` (English) |
| Default locale | `ar` |
| RTL support | Auto-detected via `isRTL` |
| Message loader | `getMessages()` async loader |

## Translation Hook

**Source:** `frontend/src/hooks/useTranslation.ts`

```tsx
const { t } = useTranslation();

// Dot-notation key access
<h1>{t('dashboard.title')}</h1>
```

**Exports:**

| Export | Type | Description |
|--------|------|-------------|
| `useTranslation` | Hook | Returns `t()` function for components |
| `translate` | Function | Standalone for non-component use |
| `TranslationKey` | Type | TypeScript type from message JSON |

### Features
- Dot-notation key access (`t('dashboard.title')`)
- TypeScript type safety with `TranslationKey`
- Fallback mechanism for missing keys
- RTL detection (`isRTL`)
- Direct `translate()` function for utilities and services

## Message Files

| File | Description |
|------|-------------|
| `i18n/messages/ar.json` | Arabic translations |
| `i18n/messages/en.json` | English translations |

## RTL Considerations

- Default locale is Arabic (RTL)
- CSS uses logical properties where possible
- Components handle bidirectional layout
- `isRTL` flag available for conditional styling
