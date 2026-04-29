/**
 * Shared i18n keys used by both backend (validation messages, e-mail templates)
 * and frontends (UI). Frontend-specific copy stays in each app's locale files.
 */
import fr from './fr.json' with { type: 'json' }
import ar from './ar.json' with { type: 'json' }

export const sharedStrings = { fr, ar } as const
export type SharedKey = keyof typeof fr
