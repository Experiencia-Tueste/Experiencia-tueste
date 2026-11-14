import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { recommend } from '@/features/barista';
import RecommendationCard from '../RecommendationCard';

const recommendation = recommend({
  intencion: 'enfoque',
  sensorial: 'equilibrio',
  tiempo: 'medio',
  equipo: 'todos',
});

describe('RecommendationCard (ritual guiado)', () => {
  it('reproduce la frecuencia y la playlist globales', async () => {
    const user = userEvent.setup();
    const onPlay = vi.fn();
    const onPlayQueue = vi.fn();
    render(
      <RecommendationCard
        recommendation={recommendation}
        onPlay={onPlay}
        onPlayQueue={onPlayQueue}
      />,
    );

    await user.click(screen.getByRole('link', { name: /Tomar la frecuencia/ }));
    await user.click(screen.getByRole('button', { name: /Reproducir playlist/ }));

    expect(onPlay).toHaveBeenCalledWith(recommendation.method.trackId);
    expect(onPlayQueue).toHaveBeenCalledWith(recommendation.playlist);
  });

  it('inicia, pausa y continúa el temporizador dentro de la carta', async () => {
    const user = userEvent.setup();
    render(
      <RecommendationCard recommendation={recommendation} onPlay={vi.fn()} onPlayQueue={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: 'Preparar guiado' }));
    expect(screen.getByRole('button', { name: 'Iniciar' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Iniciar' }));
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Pausar' }));
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument();
  });

  it('aplica un ajuste y ofrece restaurar la receta original', async () => {
    const user = userEvent.setup();
    render(
      <RecommendationCard recommendation={recommendation} onPlay={vi.fn()} onPlayQueue={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: 'Más fuerte' }));

    expect(screen.getByRole('status')).toHaveTextContent('Ajuste aplicado: dosis +2 g');
    expect(screen.getByRole('button', { name: 'Restaurar' })).toBeInTheDocument();
  });
});
