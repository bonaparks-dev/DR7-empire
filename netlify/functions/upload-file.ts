import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import Busboy from 'busboy';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Helper to parse multipart/form-data
const parseMultipartForm = (event) => {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: { 'content-type': event.headers['content-type'] }
    });
    const result = {
      files: [],
      fields: {}
    };

    busboy.on('file', (fieldname, file, { filename, encoding, mimeType }) => {
      const chunks = [];
      file.on('data', (chunk) => chunks.push(chunk));
      file.on('end', () => {
        result.files.push({
          fieldname,
          buffer: Buffer.concat(chunks),
          filename,
          encoding,
          mimeType
        });
      });
    });

    busboy.on('field', (fieldname, value) => {
      result.fields[fieldname] = value;
    });

    busboy.on('finish', () => resolve(result));
    busboy.on('error', (err) => reject(err));

    const encoding = event.isBase64Encoded ? 'base64' : 'utf-8';
    busboy.end(Buffer.from(event.body, encoding));
  });
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Allow': 'POST' },
    };
  }

  try {
    const { files, fields } = await parseMultipartForm(event);
    if (files.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No file uploaded.' }) };
    }

    const { bucket, userId, prefix } = fields;
    if (!bucket || !userId || !prefix) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields: bucket, userId, prefix.' }) };
    }

    const file = files[0];
    const fileExt = file.filename.split('.').pop();
    const filePath = `${userId}/${prefix}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase upload error: ${error.message}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ path: data.path }),
    };
  } catch (error) {
    console.error('Upload failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Upload failed: ${error.message}` }),
    };
  }
};