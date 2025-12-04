// netlify/functions/upload-file.ts
import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import * as busboy from 'busboy';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRole) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, serviceRole);
// Ajuste si tu veux autoriser plus (et vérifie la limite Supabase > Storage)
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

export const handler: Handler = async (event) => {
  try {
    // Préflight CORS
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 204, headers: CORS_HEADERS, body: '' };
    }

    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, headers: CORS_HEADERS, body: 'Method Not Allowed' };
    }

    const contentType =
      event.headers['content-type'] ||
      (event.headers['Content-Type'] as string | undefined);

    if (!contentType || !contentType.startsWith('multipart/form-data')) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Expected multipart/form-data' }),
      };
    }

    // --- Parse multipart avec Busboy ---
    const bb = busboy.default({
      headers: { 'content-type': contentType },
      limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 10 },
    });

    let bucket = '';
    let userId = '';
    let prefix = '';
    let userEmail = '';
    let userFullName = '';

    let fileBuffer: Buffer | null = null;
    let filename = '';
    let mimetype = 'application/octet-stream';

    const parsing = new Promise<{ ok: boolean; error?: string }>((resolve) => {
      bb.on('field', (name, val) => {
        if (name === 'bucket') bucket = val.trim();
        if (name === 'userId') userId = val.trim();
        if (name === 'prefix') prefix = val.trim();
        if (name === 'userEmail') userEmail = val.trim();
        if (name === 'userFullName') userFullName = val.trim();
      });

      bb.on('file', (_name, stream, info) => {
        filename = info.filename || 'file';
        mimetype = info.mimeType || mimetype;

        const chunks: Buffer[] = [];
        stream.on('data', (d: Buffer) => chunks.push(d));
        stream.on('limit', () => {
          console.warn('File hit size limit');
          resolve({ ok: false, error: 'File too large' });
          stream.resume();
        });
        stream.on('end', () => {
          fileBuffer = Buffer.concat(chunks);
        });
      });

      bb.on('error', (err) => {
        console.error('Busboy error:', err);
        resolve({ ok: false, error: 'Parse error' });
      });

      bb.on('finish', () => resolve({ ok: true }));
    });

    const bodyBuffer = Buffer.from(
      event.body || '',
      event.isBase64Encoded ? 'base64' : 'binary'
    );
    bb.end(bodyBuffer);

    const result = await parsing;
    if (!result.ok) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: result.error }),
      };
    }

    if (!bucket || !userId || !prefix || !fileBuffer) {
      console.error('Missing fields:', { bucket, userId, prefix, hasFile: !!fileBuffer });
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Missing fields or file' }),
      };
    }

    // Normalise le nom de fichier (évite espaces/caractères exotiques)
    const safeName = filename.replace(/[^\w.\-]+/g, '_');
    const ext = safeName.includes('.') ? safeName.split('.').pop() : 'bin';
    const path = `${userId}/${prefix}_${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(path, fileBuffer, {
        contentType: mimetype,
        upsert: true,
      });

    if (upErr) {
      console.error('Supabase upload error:', upErr);
      return {
        statusCode: 502,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'Upload failed',
          details: upErr.message,
          bucket,
          path
        }),
      };
    }

    // Create database record in user_documents table for admin panel
    const { error: dbErr } = await supabase
      .from('user_documents')
      .insert({
        user_id: userId,
        user_email: userEmail || null,
        user_full_name: userFullName || null,
        document_type: prefix,
        file_path: path,
        bucket: bucket,
        upload_date: new Date().toISOString(),
        status: 'pending_verification'
      });

    if (dbErr) {
      console.error('Failed to create user_documents record:', dbErr);
      // Don't fail the upload, just log the error
    }

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      body: JSON.stringify({
        ok: true,
        bucket,
        path,
        publicUrl: pub?.publicUrl ?? null, // null si bucket privé
      }),
    };
  } catch (e: any) {
    console.error('Function fatal error:', e);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Server error' }),
    };
  }
};
