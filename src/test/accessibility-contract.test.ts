import { describe, expect, it } from 'vitest';
import source from '../pages/index.astro?raw';

describe('frontend accessibility contract', () => {
  it('supports keyboard submit shortcut', () => {
    expect(source).toContain('(event.ctrlKey || event.metaKey) && event.key === \'Enter\'');
    expect(source).toContain('els.form.requestSubmit()');
  });

  it('keeps explicit input label and status live region', () => {
    expect(source).toContain('label for="input-text"');
    expect(source).toContain('aria-live="polite"');
  });

  it('keeps submit/clear controls discoverable', () => {
    expect(source).toContain('id="submit-btn"');
    expect(source).toContain('id="clear-btn"');
  });
});
