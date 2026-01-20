#!/bin/bash

# Script to migrate a TypeScript/TSX file from Stripe to Nexi
# Usage: ./migrate_to_nexi.sh <filepath>

FILE="$1"

if [ -z "$FILE" ]; then
  echo "Usage: $0 <filepath>"
  exit 1
fi

echo "Migrating $FILE from Stripe to Nexi..."

# 1. Remove Stripe imports
sed -i '' '/import.*@stripe\/stripe-js/d' "$FILE"
sed -i '' '/import.*@stripe\/react-stripe-js/d' "$FILE"

# 2. Remove STRIPE_PUBLISHABLE_KEY constant
sed -i '' '/const STRIPE_PUBLISHABLE_KEY =/d' "$FILE"

# 3. Replace stripe state variable declarations with simple processing state
# This is complex, so we'll do it manually for each file

# 4. Replace stripeError with paymentError
sed -i '' 's/stripeError/paymentError/g' "$FILE"
sed -i '' 's/setStripeError/setPaymentError/g' "$FILE"

# 5. Replace stripe/elements/clientSecret checks
sed -i '' 's/!stripe || !elements || !clientSecret/!selectedPackage/g' "$FILE"

echo "✅ Basic Stripe removal complete for $FILE"
echo "⚠️  Manual steps still required:"
echo "   - Replace payment handler logic"
echo "   - Update UI to remove card elements"
echo "   - Test the migration"
