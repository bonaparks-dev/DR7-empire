import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import Busboy from 'busboy';

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!supabaseUrl || !serviceRole) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, serviceRole);

// Optionnel: limite la taille (en octets). Ici ~15 Mo.
const MAX_FILE_SIZE = 15 * 1024 * 1024;

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    if (!contentType || !contentType.startsWith('multipart/form-data')) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Expected multipart/form-data' }) };
    }

    // Parse multipart avec Busboy
    const busboy = Busboy({
      headers: { 'content-type': contentType },
      limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 10 },
    });

    let bucket = '';
    let userId = '';
    let prefix = '';

    // On accumule le fichier en mémoire (OK pour des documents KYC)
    let fileBuffer: Buffer | null = null;
    let filename = '';
    let mimetype = '';

    const parsing = new Promise<{ ok: boolean; error?: string }>((resolve) => {
      busboy.on('field', (name, val) => {
        if (name === 'bucket') bucket = val.trim();
        if (name === 'userId') userId = val.trim();
        if (name === 'prefix') prefix = val.trim();
      });

      busboy.on('file', (_name, stream, info) => {
        filename = info.filename || 'file';
        mimetype  = info.mimeType || 'application/octet-stream';

        const chunks: Buffer[] = [];
        stream.on('data', (d: Buffer) => chunks.push(d));
        stream.on('limit', () => {
          resolve({ ok: false, error: 'File too large' });
          stream.resume();
        });
        stream.on('end', () => {
          fileBuffer = Buffer.concat(chunks);
        });
      });

      busboy.on('error', (err) => {
        console.error('Busboy error:', err);
        resolve({ ok: false, error: 'Parse error' });
      });

      busboy.on('finish', () => resolve({ ok: true }));
    });

    // Alimente busboy
    const bodyBuffer = Buffer.from(event.body || '', event.isBase64Encoded ? 'base64' : 'binary');
    busboy.end(bodyBuffer);

    const result = await parsing;
    if (!result.ok) {
      return { statusCode: 400, body: JSON.stringify({ error: result.error }) };
    }

    if (!bucket || !userId || !prefix || !fileBuffer) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields or file' }) };
    }

    const ext = filename.includes('.') ? filename.split('.').pop() : 'bin';
    const path = `${userId}/${prefix}_${Date.now()}.${ext}`;

    const { error: upErr } = await supabase
      .storage
      .from(bucket)
      .upload(path, fileBuffer, {
        contentType: mimetype,
        upsert: true, // si tu veux écraser d’anciens docs
      });

    if (upErr) {
      console.error('Supabase upload error:', upErr);
      return { statusCode: 502, body: JSON.stringify({ error: 'Upload failed' }) };
    }

    // Optionnel: URL publique si le bucket est public
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        bucket,
        path,
        publicUrl: pub?.publicUrl ?? null,
      }),
    };
  } catch (e: any) {
    console.error('Function error:', e);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};
