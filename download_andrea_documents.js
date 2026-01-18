const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const userId = '9f4f8417-6383-42c9-9a3a-a712f8393275';
const outputDir = './andrea_documents';

async function downloadAndreaDocuments() {
    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('Fetching Andrea\'s documents from database...');

    // Get document records
    const { data: documents, error } = await supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', userId)
        .order('upload_date', { ascending: true });

    if (error) {
        console.error('Error fetching documents:', error);
        return;
    }

    console.log(`Found ${documents.length} documents`);

    // Download each document
    for (const doc of documents) {
        console.log(`\nDownloading ${doc.document_type}...`);
        console.log(`  Bucket: ${doc.bucket}`);
        console.log(`  Path: ${doc.file_path}`);

        try {
            const { data, error: downloadError } = await supabase
                .storage
                .from(doc.bucket)
                .download(doc.file_path);

            if (downloadError) {
                console.error(`  ❌ Error downloading: ${downloadError.message}`);
                continue;
            }

            // Save to file
            const fileName = `${doc.document_type}.jpg`;
            const filePath = path.join(outputDir, fileName);

            const arrayBuffer = await data.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            fs.writeFileSync(filePath, buffer);

            console.log(`  ✅ Saved to: ${filePath}`);
        } catch (err) {
            console.error(`  ❌ Error: ${err.message}`);
        }
    }

    console.log(`\n✅ All documents downloaded to: ${outputDir}`);
    console.log('\nNext steps:');
    console.log('1. Open the images and manually read the data');
    console.log('2. Or use OCR to extract the data automatically');
    console.log('3. Update Andrea\'s record in customers_extended');
}

downloadAndreaDocuments().catch(console.error);
