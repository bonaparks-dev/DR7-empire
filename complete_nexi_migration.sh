#!/bin/bash

# Complete Nexi Migration Script for Remaining Files
# This script migrates CreditWalletPage, MechanicalBookingPage, and CarBookingWizard

echo "🚀 Starting Nexi Migration for remaining files..."

# File 1: CreditWalletPage.tsx
echo ""
echo "📝 Migrating CreditWalletPage.tsx..."

FILE1="/Users/opheliegiraud/antigravity-dr7web/DR7-empire/pages/CreditWalletPage.tsx"

# Remove Stripe import
sed -i '' '/import type { Stripe, StripeElements } from/d' "$FILE1"

# Remove STRIPE_PUBLISHABLE_KEY
sed -i '' '/^const STRIPE_PUBLISHABLE_KEY/d' "$FILE1"

# Replace state variables
sed -i '' 's/const \[stripe, setStripe\] = useState<Stripe | null>(null);/\/\/ Nexi - no stripe needed/g' "$FILE1"
sed -i '' 's/const \[elements, setElements\] = useState<StripeElements | null>(null);/\/\/ Nexi - no elements needed/g' "$FILE1"
sed -i '' 's/const cardElementRef = useRef<HTMLDivElement>(null);/\/\/ Nexi - no card element/g' "$FILE1"
sed -i '' 's/const \[clientSecret, setClientSecret\] = useState<string | null>(null);/\/\/ Nexi - no client secret/g' "$FILE1"
sed -i '' 's/const \[isClientSecretLoading, setIsClientSecretLoading\] = useState(false);/\/\/ Nexi - no loading/g' "$FILE1"
sed -i '' 's/stripeError/paymentError/g' "$FILE1"
sed -i '' 's/setStripeError/setPaymentError/g' "$FILE1"

echo "✅ CreditWalletPage basic cleanup done"
echo "⚠️  Still need to replace payment handler manually"

# File 2: MechanicalBookingPage.tsx
echo ""
echo "📝 Migrating MechanicalBookingPage.tsx..."

FILE2="/Users/opheliegiraud/antigravity-dr7web/DR7-empire/pages/MechanicalBookingPage.tsx"

sed -i '' '/import type { Stripe, StripeElements } from/d' "$FILE2"
sed -i '' '/^const STRIPE_PUBLISHABLE_KEY/d' "$FILE2"
sed -i '' 's/const \[stripe, setStripe\] = useState<Stripe | null>(null);/\/\/ Nexi - no stripe/g' "$FILE2"
sed -i '' 's/const \[elements, setElements\] = useState<StripeElements | null>(null);/\/\/ Nexi - no elements/g' "$FILE2"
sed -i '' 's/const cardElementRef = useRef<HTMLDivElement>(null);/\/\/ Nexi - no card element/g' "$FILE2"
sed -i '' 's/const \[clientSecret, setClientSecret\] = useState<string | null>(null);/\/\/ Nexi - no client secret/g' "$FILE2"
sed -i '' 's/const \[isClientSecretLoading, setIsClientSecretLoading\] = useState(false);/\/\/ Nexi - no loading/g' "$FILE2"
sed -i '' 's/stripeError/paymentError/g' "$FILE2"
sed -i '' 's/setStripeError/setPaymentError/g' "$FILE2"

echo "✅ MechanicalBookingPage basic cleanup done"

# File 3: CarBookingWizard.tsx
echo ""
echo "📝 Migrating CarBookingWizard.tsx..."

FILE3="/Users/opheliegiraud/antigravity-dr7web/DR7-empire/components/ui/CarBookingWizard.tsx"

sed -i '' '/import type { Stripe, StripeCardElement } from/d' "$FILE3"
sed -i '' '/^const STRIPE_PUBLISHABLE_KEY/d' "$FILE3"
sed -i '' 's/const \[stripe, setStripe\] = useState<Stripe | null>(null);/\/\/ Nexi - no stripe/g' "$FILE3"
sed -i '' 's/const \[cardElement, setCardElement\] = useState<StripeCardElement | null>(null);/\/\/ Nexi - no card element/g' "$FILE3"
sed -i '' 's/const cardElementRef = useRef<HTMLDivElement>(null);/\/\/ Nexi - no card ref/g' "$FILE3"
sed -i '' 's/const \[clientSecret, setClientSecret\] = useState<string | null>(null);/\/\/ Nexi - no client secret/g' "$FILE3"
sed -i '' 's/const \[isClientSecretLoading, setIsClientSecretLoading\] = useState(false);/\/\/ Nexi - no loading/g' "$FILE3"
sed -i '' 's/stripeError/paymentError/g' "$FILE3"
sed -i '' 's/setStripeError/setPaymentError/g' "$FILE3"

echo "✅ CarBookingWizard basic cleanup done"

echo ""
echo "✅ Basic Stripe removal complete for all 3 files!"
echo ""
echo "⚠️  MANUAL STEPS REQUIRED:"
echo "1. Replace payment handlers with Nexi redirect logic"
echo "2. Update UI to remove card elements"
echo "3. Remove Stripe useEffect hooks"
echo "4. Test each flow"
