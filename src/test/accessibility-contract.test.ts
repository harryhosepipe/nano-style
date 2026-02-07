import { describe, expect, it } from 'vitest';
import source from '../pages/index.astro?raw';

describe('frontend accessibility contract', () => {
  it('supports keyboard submit shortcut', () => {
    expect(source).toContain('(event.ctrlKey || event.metaKey) && event.key === \'Enter\'');
    expect(source).toContain('els.form.requestSubmit()');
  });

  it('keeps focus management for step transitions', () => {
    expect(source).toContain("document.getElementById('answer-input')");
    expect(source).toContain("document.getElementById('initial-input')");
    expect(source).toContain('target?.focus?.()');
  });

  it('keeps progress semantics for 3-step refinement', () => {
    expect(source).toContain('Question ${step} of 3');
    expect(source).toContain('Math.round((step / 3) * 100)');
  });
});
