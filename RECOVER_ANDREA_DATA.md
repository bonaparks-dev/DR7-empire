# Quick Recovery Guide for Andrea's Data

## 🎯 Fastest Method: Download Documents from Supabase

### Step 1: Run the Download Script
```bash
cd /Users/opheliegiraud/antigravity-dr7web/DR7-empire
node download_andrea_documents.js
```

This will download all 5 documents to `./andrea_documents/`:
- `carta_front.jpg`
- `carta_back.jpg`
- `patente_front.jpg`
- `patente_back.jpg`
- `codice_fiscale.jpg`

### Step 2: Extract Data from Images

Open each image and read:

**From `codice_fiscale.jpg`**:
- Codice Fiscale (16 characters)

**From `carta_front.jpg` and `carta_back.jpg`**:
- Full address (Via, numero civico, CAP, città, provincia)
- Birth date and place (data di nascita, città di nascita, provincia)
- Gender (sesso: M/F)

**From `patente_front.jpg` and `patente_back.jpg`**:
- License type (tipo patente: B, C, etc.)
- License number (numero patente)
- Issued by (patente emessa da: usually "MIT" or "Motorizzazione")
- Issue date (patente data rilascio)
- Expiry date (patente scadenza)

### Step 3: Update Database

Once you have the data, run this SQL (replace XXXX with actual values):

```sql
UPDATE customers_extended
SET
  codice_fiscale = 'XXXXXXXXXXXXXXXX',
  indirizzo = 'Via XXXXX',
  numero_civico = 'XX',
  citta_residenza = 'XXXXX',
  provincia_residenza = 'XX',
  codice_postale = 'XXXXX',
  sesso = 'M',
  data_nascita = 'YYYY-MM-DD',
  citta_nascita = 'XXXXX',
  provincia_nascita = 'XX',
  metadata = jsonb_build_object(
    'tipo_patente', 'B',
    'numero_patente', 'XXXXXXXXX',
    'patente_emessa_da', 'MIT',
    'patente_data_rilascio', 'YYYY-MM-DD',
    'patente_scadenza', 'YYYY-MM-DD'
  ),
  source = 'website',
  updated_at = NOW()
WHERE user_id = '9f4f8417-6383-42c9-9a3a-a712f8393275';
```

---

## 🔍 Alternative: Check Netlify Logs

1. Go to Netlify Dashboard
2. Functions → `register-customer`
3. Filter by date: 2026-01-09
4. Search for: `andreiii1710@icloud.com` or `9f4f8417-6383-42c9-9a3a-a712f8393275`
5. Look for the logged `customerData` object

If found, the logs will have ALL the form data Andrea entered.

---

## ⏱️ Estimated Time

- **Download documents**: 1 minute
- **Read and extract data**: 5-10 minutes
- **Update database**: 1 minute

**Total**: ~10-15 minutes to fully recover Andrea's data
