import { describe, expect, it } from 'vitest';

import { APP_THEMES, normalizeAppTheme, resolveVisibleTheme } from './types';

describe('preferencias de tema', () => {
  it('conserva los temas compatibles', () => {
    for (const theme of APP_THEMES) expect(normalizeAppTheme(theme)).toBe(theme);
  });

  it('migra el valor oscuro heredado al tema Lima', () => {
    expect(normalizeAppTheme('Oscuro')).toBe('Lima');
    expect(normalizeAppTheme(null)).toBe('Lima');
    expect(normalizeAppTheme('Desconocido')).toBe('Lima');
  });

  it('usa la vista previa sin cambiar la preferencia guardada', () => {
    expect(resolveVisibleTheme('Lima', null)).toBe('Lima');
    expect(resolveVisibleTheme('Lima', 'Cobalto')).toBe('Cobalto');
    expect(resolveVisibleTheme('Ámbar', null)).toBe('Ámbar');
  });
});
