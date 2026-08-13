import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Verificación estática (sin navegador): dentro del media query
 * prefers-reduced-motion del CSS de la tarjeta Experiencia, el halo
 * del arte no debe conservar animación.
 */
function cssUnderTest(): string {
  return readFileSync(resolve(__dirname, '../components/ExperienceCard.module.css'), 'utf-8');
}

function reducedMotionBlock(css: string): string {
  const start = css.indexOf('@media (prefers-reduced-motion: reduce)');
  expect(start).toBeGreaterThanOrEqual(0);
  // Busca la llave de cierre del media query contando llaves anidadas.
  let depth = 0;
  let end = -1;
  for (let i = css.indexOf('{', start); i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  expect(end).toBeGreaterThanOrEqual(0);
  return css.slice(start, end + 1);
}

describe('ExperienceCard CSS (prefers-reduced-motion)', () => {
  it('incluye el media query de reduced motion', () => {
    expect(cssUnderTest()).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('.halo no conserva animación dentro de reduced motion', () => {
    const block = reducedMotionBlock(cssUnderTest());
    expect(block).toMatch(/\.halo[\s\S]*?animation:\s*none/);
  });

  it('.art no conserva transición/escala dentro de reduced motion', () => {
    const block = reducedMotionBlock(cssUnderTest());
    expect(block).toMatch(/\.art[\s\S]*?transition:\s*none/);
    expect(block).toMatch(/\.card:hover \.art[\s\S]*?transform:\s*none/);
  });
});

describe('ExperienceArtworkMotion CSS (prefers-reduced-motion)', () => {
  const motionCss = readFileSync(
    resolve(__dirname, '../components/ExperienceArtworkMotion.module.css'),
    'utf-8',
  );

  it('incluye el media query de reduced motion', () => {
    expect(motionCss).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('detiene remates y partículas en reduced motion', () => {
    const start = motionCss.indexOf('@media (prefers-reduced-motion: reduce)');
    const block = motionCss.slice(start);
    expect(block).toMatch(/\.rayCap[\s\S]*?animation:\s*none/);
    expect(block).toMatch(/\.rayCap[\s\S]*?stroke-dasharray:\s*0\.62 1/);
    expect(block).toMatch(/\.particle[\s\S]*?animation:\s*none/);
    expect(block).not.toContain('.waveBar');
  });

  it('no quedaron reglas del anillo giratorio', () => {
    for (const forbidden of ['ringRotate', 'ringBreathe', 'ringSpin', 'ringBreath']) {
      expect(motionCss).not.toContain(forbidden);
    }
  });
});
