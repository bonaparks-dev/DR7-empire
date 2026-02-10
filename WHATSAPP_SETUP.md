# WhatsApp Business API Setup

## Environment Variables for Netlify

Add these to your Netlify environment variables:

### 1. WHATSAPP_BUSINESS_TOKEN
```
EAFnnIPzu6F8BP7cZCZBsTHyhScVXe7MCSoUQBddTfpS65aEM6kIuw7lRQpY8FiuV2IXA4sB0fQOzgGEUZCAcPOW7depD3ZA2pfg1qTxngZAKIGWQdAcx1T2fzRCgtTyTxdQySZBm9ngLwGh8jzqX2yVwOt94VGZB8hA45qx2LocowZCYpgg6lkk2pP7qrAd5DAZDZD
```

### 2. WHATSAPP_BUSINESS_PHONE_ID
```
[PASTE YOUR PHONE NUMBER ID HERE]
```

## How to Add to Netlify

1. Go to: https://app.netlify.com/
2. Select your site (DR7-empire)
3. Go to: Site settings → Environment variables
4. Click "Add a variable"
5. Add both variables above

## Notifications Sent To
+393457905205

## What Triggers Notifications
- ✅ Car rental bookings
- ✅ Car wash service bookings

## Finding Your Credentials

1. Go to: https://business.facebook.com/
2. Navigate to: WhatsApp → API Setup
3. Copy "Phone number ID" (looks like: 123456789012345)
4. Token is already configured above

## Testing

After adding the environment variables to Netlify:
1. Deploy the site (or trigger a redeploy)
2. Make a test booking
3. You should receive a WhatsApp message automatically
