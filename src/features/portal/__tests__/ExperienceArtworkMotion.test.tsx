import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ExperienceArtworkMotion, { RAY_CAPS } from '../components/ExperienceArtworkMotion';

const SOURCE = readFileSync(
  resolve(__dirname, '../components/ExperienceArtworkMotion.tsx'),
  'utf-8',
);

/** Código sin comentarios: los checks no chocan con el JSDoc. */
const CODE = SOURCE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

describe('ExperienceArtworkMotion (capa decorativa del arte)', () => {
  it('es decorativo: aria-hidden y sin interacción', () => {
    const { container } = render(<ExperienceArtworkMotion />);

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
  });

  it('usa el viewBox real del arte (1448 × 1086)', () => {
    const { container } = render(<ExperienceArtworkMotion />);
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 1448 1086');
  });

  it('no usa APIs de reproducción ni de navegador', () => {
    for (const forbidden of [
      'getContext',
      'AudioContext',
      'webkitAudioContext',
      'createElement("audio"',
      'createElement("canvas"',
      'new Audio(',
    ]) {
      expect(CODE).not.toContain(forbidden);
    }
  });

  it('no usa aleatoriedad, fechas, timers ni trigonometría en runtime', () => {
    for (const forbidden of [
      'Math.random(',
      'Date.now(',
      'requestAnimationFrame(',
      'setInterval(',
      'setTimeout(',
      'Math.sin(',
      'Math.cos(',
    ]) {
      expect(CODE).not.toContain(forbidden);
    }
  });

  it('define 64 remates radiales (RAY_CAPS) con pathLength=1', () => {
    expect(RAY_CAPS).toHaveLength(64);
    const { container } = render(<ExperienceArtworkMotion />);
    const caps = container.querySelectorAll('[pathLength="1"]');
    expect(caps).toHaveLength(64);
  });

  it('cada remate es un segmento con longitud (x1/y1 hacia fuera, x2/y2 hacia dentro)', () => {
    for (const ray of RAY_CAPS) {
      // En los ejes cardinales una coordenada coincide (vertical/horizontal);
      // lo esencial es que el segmento tenga longitud real.
      expect(Math.hypot(ray.x1 - ray.x2, ray.y1 - ray.y2)).toBeGreaterThan(1);
    }
  });

  it('eliminó el sistema de anillo giratorio anterior', () => {
    for (const forbidden of [
      'ringRotate',
      'ringBreathe',
      'ringSpin',
      'ringBreath',
      'translate(0 -17)',
    ]) {
      expect(SOURCE).not.toContain(forbidden);
    }
  });

  it('eliminó las barras laterales del ecualizador', () => {
    for (const forbidden of ['waveBar', 'waveTeal', 'waveViolet', 'wavePulse']) {
      expect(SOURCE).not.toContain(forbidden);
    }
  });

  it('conserva solo los 64 remates y las partículas', () => {
    const { container } = render(<ExperienceArtworkMotion />);
    expect(container.querySelectorAll('[pathLength="1"]')).toHaveLength(64);
    expect(container.querySelectorAll('line')).toHaveLength(64);
    expect(container.querySelectorAll('circle').length).toBe(8);
  });
});
