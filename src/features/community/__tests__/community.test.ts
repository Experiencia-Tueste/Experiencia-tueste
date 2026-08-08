import { describe, expect, it } from 'vitest';
import { COMUNIDAD_CTA, comunidadMensaje, createPost, SEED_POSTS, toggleLike } from '../index';

describe('feature community', () => {
  it('alterna el like de forma idempotente', () => {
    const once = toggleLike(SEED_POSTS, 'p1');
    expect(once[0].likes).toBe(15);
    expect(once[0].likedByMe).toBe(true);

    const twice = toggleLike(once, 'p1');
    expect(twice[0].likes).toBe(14);
    expect(twice[0].likedByMe).toBe(false);
  });

  it('no modifica otros posts al dar like', () => {
    const result = toggleLike(SEED_POSTS, 'p2');
    expect(result[0].likes).toBe(14);
    expect(result[1].likes).toBe(10);
  });

  it('crea un post nuevo al inicio de la lista', () => {
    const posts = createPost(SEED_POSTS, {
      author: 'María',
      category: 'Café',
      title: 'Hola',
      body: 'Un saludo a la comunidad',
    });
    expect(posts).toHaveLength(SEED_POSTS.length + 1);
    expect(posts[0].title).toBe('Hola');
    expect(posts[0].mine).toBe(true);
  });

  it('expone el contenido estático del CTA público de comunidad', () => {
    expect(COMUNIDAD_CTA.encabezado).toBe('10 / COMUNIDAD');
    expect(COMUNIDAD_CTA.mensaje).toBe('No solo lo escuchas. Lo vives.');
    expect(COMUNIDAD_CTA.cta).toBe('Unirme');
    expect(COMUNIDAD_CTA.cierre).toBe('El café también se escucha.');
    expect(COMUNIDAD_CTA.volver).toBe('Volver a la escucha');
    expect(COMUNIDAD_CTA.texto).toMatch(/frecuencias/i);
    expect(COMUNIDAD_CTA.texto).toContain('Casa Cántara');
    expect(COMUNIDAD_CTA.aviso).toContain('no se envía ni se guarda');
  });

  it('el mensaje de activación es genérico y no contiene correos ni canales externos', () => {
    const msg = comunidadMensaje();
    expect(msg).toContain('se habilitará cuando el cliente confirme el flujo');
    expect(msg).toContain('tratamiento de datos');
    expect(msg).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    expect(msg).not.toMatch(/whatsapp|wa\.me|\+57|tel:|http/i);
  });
});
