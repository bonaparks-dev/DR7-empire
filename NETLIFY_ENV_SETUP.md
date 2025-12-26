# ⚠️ URGENT: Add Nexi Environment Variables to Netlify

## The Issue
The Nexi payment function is returning "Nexi configuration error" because the environment variables are not set in Netlify yet.

## 🚀 Quick Fix (5 minutes)

### Step 1: Go to Netlify Dashboard
1. Open https://app.netlify.com
2. Select your **DR7 Empire** site
3. Go to **Site settings** → **Environment variables**

### Step 2: Add These Variables

Click **Add a variable** for each of these:

```
NEXI_ALIAS=payment_3892082
```

```
NEXI_MAC_KEY=O1c57OA4aH7o434dH79KCK7IFoh7g0KZ869K1OMt
```

```
NEXI_MERCHANT_ID=03892082
```

```
NEXI_TERMINAL_ID=03892082
```

```
NEXI_CODICE_PUNTO_VENDITA=001859607
```

```
NEXI_API_KEY_SANDBOX=5d952446-9004-4023-9eae-a527a152846b
```

```
NEXI_API_KEY_PRODUCTION=5d952446-9004-4023-9eae-a527a152846b
```

```
NEXI_API_KEY_MANUAL_PRODUCTION=2d708950-50a1-434e-9a93-5d3ae2f1dd9f
```

```
NEXI_TOKEN_REQUESTOR_ID_VTSM=40060519423
```

```
NEXI_TOKEN_REQUESTOR_ID_MDES=50150403604
```

```
NEXI_ENVIRONMENT=sandbox
```

```
VITE_NEXI_ENVIRONMENT=sandbox
```

### Step 3: Redeploy

After adding all variables:
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait 2-3 minutes for deployment

### Step 4: Test

Once deployed, test at:
- **https://dr7empire.com/.netlify/functions/test-nexi**

Use test card:
- **Number**: `4539 9700 0000 0006`
- **Expiry**: `12/25`
- **CVV**: `123`

---

## 💡 Why This Happened

The `.env` file is in `.gitignore` (for security), so environment variables don't get pushed to GitHub or Netlify. You must add them manually in the Netlify dashboard.

---

## ✅ After Adding Variables

The test page will work and you'll be able to:
1. Create test payments
2. Get redirected to Nexi payment page
3. Complete payment with test cards
4. See the callback webhook working

---

## 🆘 Need Help?

If you have trouble finding the environment variables section in Netlify:
1. Site settings (gear icon)
2. Left sidebar: **Environment variables**
3. Click **Add a variable**
4. Paste each key-value pair above
