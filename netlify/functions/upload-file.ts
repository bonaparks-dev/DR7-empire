import type { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import Busboy from 'busboy';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) {
  throw new Error('SUPABASE_URL is not set.');
}
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseServiceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set.');
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Allow': 'POST' },
    };
  }

  // Use a promise to handle the async nature of busboy
  return new Promise((resolve) => {
    const busboy = new Busboy({
      headers: { 'content-type': event.headers['content-type'] },
    });

    const fields: Record<string, string> = {};

    // This promise will be resolved with the upload result
    let uploadPromise: Promise<{ data: any; error: any }> | null = null;

    busboy.on('field', (fieldname, value) => {
      fields[fieldname] = value;
    });

    busboy.on('file', (fieldname, fileStream, { filename, mimeType }) => {
      // When the file stream starts, we immediately begin uploading it to Supabase.
      // This assumes 'bucket', 'userId', and 'prefix' fields are sent before the file,
      // which is standard for most HTTP clients.

      const { bucket, userId, prefix } = fields;
      if (!bucket || !userId || !prefix) {
        // If required fields are missing, we can't proceed.
        // We drain the stream to prevent hanging and will fail on 'finish'.
        fileStream.resume();
        return;
      }

      const fileExt = filename.split('.').pop();
      const filePath = `${userId}/${prefix}_${Date.now()}.${fileExt}`;

      // Start the upload and store the promise.
      // The 'duplex: 'half'' option is crucial for streaming with Supabase v2 client.
      uploadPromise = supabase.storage
        .from(bucket)
        .upload(filePath, fileStream, {
          contentType: mimeType,
          upsert: false,
          duplex: 'half',
        });
    });

    busboy.on('finish', async () => {
      if (!uploadPromise) {
        // This happens if the file part came before the required fields,
        // or if no file was uploaded at all.
        return resolve({
          statusCode: 400,
          body: JSON.stringify({ error: 'Upload failed: Missing file or required fields (bucket, userId, prefix).' }),
        });
      }

      try {
        const { data, error } = await uploadPromise;
        if (error) {
          // Handle Supabase-specific errors
          throw new Error(`Supabase upload error: ${error.message}`);
        }
        // Success
        resolve({
          statusCode: 200,
          body: JSON.stringify({ path: data.path }),
        });
      } catch (error: any) {
        console.error('Upload processing failed:', error);
        resolve({
          statusCode: 500,
          body: JSON.stringify({ error: `Upload failed: ${error.message}` }),
        });
      }
    });

    busboy.on('error', (err: Error) => {
      console.error('Busboy parsing error:', err);
      resolve({
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to parse form data.' }),
      });
    });

    // Decode the body if it's base64 encoded and pipe it to busboy
    const encoding = event.isBase64Encoded ? 'base64' : 'binary';
    busboy.end(Buffer.from(event.body || '', encoding));
  });
};