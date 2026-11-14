/**
 * Sube los masters de audio a Supabase Storage (bucket público `radio`).
 * ---------------------------------------------------------------------
 * El audio pesado no vive en el repo ni en Postgres: se sirve como objeto
 * público desde Storage, con range requests y CDN. Este script crea el
 * bucket público si falta y sube cada `.opus` (streaming) y `.wav`
 * (master lossless) de un directorio local.
 *
 * Uso (las credenciales las inyecta node, nunca se imprimen):
 *   node --env-file=.env.local scripts/upload-radio-audio.mjs [dir]
 * `dir` por defecto es `public/audio`.
 *
 * Variables requeridas: SUPABASE_STORAGE_URL, SUPABASE_STORAGE_ADMIN_KEY.
 * El bucket se puede sobreescribir con RADIO_AUDIO_BUCKET (default: radio).
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Se quitan TODOS los espacios/saltos de línea de las credenciales: cuando
// la key queda partida en varias líneas en el panel, fetch la rechaza con
// «is an invalid header value». Ni la URL ni la key de Supabase tienen
// espacios internos legítimos, así que limpiarlas por completo es seguro.
const stripWs = (value) => value?.replace(/\s+/g, '');
const rawKey = process.env.SUPABASE_STORAGE_ADMIN_KEY ?? '';
const storageUrl = stripWs(process.env.SUPABASE_STORAGE_URL);
const adminKey = stripWs(rawKey);
const bucket = (process.env.RADIO_AUDIO_BUCKET ?? 'radio').trim();
const dir = process.argv[2] ?? 'public/audio';

// Diagnóstico sin exponer secretos: solo longitudes, nunca el valor.
if (rawKey && rawKey.length !== adminKey.length) {
  console.warn(
    `AVISO: la key traía espacios/saltos (len ${rawKey.length} → ${adminKey.length}); se limpiaron.`,
  );
}

if (!storageUrl || !adminKey) {
  console.error(
    'Faltan SUPABASE_STORAGE_URL y/o SUPABASE_STORAGE_ADMIN_KEY. ' +
      'Corré con: node --env-file=.env.local scripts/upload-radio-audio.mjs',
  );
  process.exit(1);
}

// Aviso de coherencia: las URLs públicas del cliente se arman con
// NEXT_PUBLIC_SUPABASE_URL. Si el host de Storage difiere, no resolverán.
const publicBaseEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (publicBaseEnv) {
  try {
    const a = new URL(storageUrl).host;
    const b = new URL(publicBaseEnv).host;
    if (a !== b) {
      console.warn(
        `AVISO: SUPABASE_STORAGE_URL (${a}) y NEXT_PUBLIC_SUPABASE_URL (${b}) ` +
          'tienen hosts distintos; las URLs públicas del player no resolverán.',
      );
    }
  } catch {
    // URLs mal formadas: el resto del script igual falla con un error claro.
  }
}

const CONTENT_TYPE = { '.opus': 'audio/ogg', '.wav': 'audio/wav' };

const client = createClient(storageUrl, adminKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function ensurePublicBucket() {
  const { data: buckets, error } = await client.storage.listBuckets();
  if (error) throw error;
  const exists = buckets?.some((b) => b.name === bucket);
  if (!exists) {
    const { error: createError } = await client.storage.createBucket(bucket, { public: true });
    if (createError) throw createError;
    console.log(`Bucket "${bucket}" creado (público).`);
  } else {
    const { error: updateError } = await client.storage.updateBucket(bucket, { public: true });
    if (updateError) throw updateError;
    console.log(`Bucket "${bucket}" ya existía; asegurado público.`);
  }
}

/** ¿El error es el límite de tamaño por archivo del proyecto (413)? */
function isTooLarge(error) {
  return (
    error?.statusCode === '413' ||
    error?.status === 413 ||
    error?.code === 'EntityTooLarge' ||
    /entity too large|exceeded the maximum/i.test(error?.message ?? '')
  );
}

async function main() {
  await ensurePublicBucket();

  const entries = await readdir(dir);
  const files = entries.filter((f) => CONTENT_TYPE[path.extname(f).toLowerCase()]);
  if (files.length === 0) {
    console.error(`No hay archivos .opus/.wav en ${dir}.`);
    process.exit(1);
  }

  // Primero los Opus (streaming, livianos): son los que hacen sonar la app.
  // Después los WAV (master lossless), que pueden exceder el límite de tamaño.
  const priority = (f) => (path.extname(f).toLowerCase() === '.opus' ? 0 : 1);
  const ordered = files.sort((a, b) => priority(a) - priority(b) || a.localeCompare(b));

  const tooLarge = [];
  const hardFailures = [];

  for (const file of ordered) {
    const ext = path.extname(file).toLowerCase();
    const body = await readFile(path.join(dir, file));
    const sizeMb = (body.length / 1024 / 1024).toFixed(1);
    const { error } = await client.storage.from(bucket).upload(file, body, {
      contentType: CONTENT_TYPE[ext],
      upsert: true,
    });
    if (!error) {
      console.log(`subido   ${file}  (${sizeMb} MB)`);
    } else if (isTooLarge(error)) {
      // No abortamos: el master WAV es descarga opcional; el Opus ya sirve.
      console.warn(`salteado ${file}  (${sizeMb} MB) — supera el límite del proyecto`);
      tooLarge.push(file);
    } else {
      console.error(`FALLÓ    ${file}: ${error.message ?? error}`);
      hardFailures.push(file);
    }
  }

  const base = `${storageUrl.replace(/\/+$/, '')}/storage/v1/object/public/${bucket}/`;
  console.log(`\nBase pública: ${base}`);

  if (tooLarge.length > 0) {
    console.log(
      `\n${tooLarge.length} archivo(s) superaron el límite de tamaño del proyecto:\n  ` +
        tooLarge.join('\n  ') +
        '\nSubí «Upload file size limit» en Supabase (Storage → Settings) y reejecutá ' +
        'este script para completar los masters WAV. Los Opus ya quedaron arriba.',
    );
  }

  if (hardFailures.length > 0) {
    console.error(`\n${hardFailures.length} archivo(s) fallaron por otra razón (ver arriba).`);
    process.exit(1);
  }

  console.log('\nListo.');
}

main().catch((err) => {
  console.error('Fallo al subir:', err);
  process.exit(1);
});
