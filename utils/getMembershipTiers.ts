// Adapter: returns the legacy MEMBERSHIP_TIERS[] shape backed by admin
// data (centralina_pro_config.site_copy.dr7ClubPlan). Consumers like
// MembershipPage / MembershipEnrollmentPage / MembershipStatus can use
// this without rewriting their feature-list rendering.
import type { MembershipTier } from '../types';
import { getDr7ClubPlanCopy } from './siteCopy';

export async function getMembershipTiers(): Promise<MembershipTier[]> {
  const plan = await getDr7ClubPlanCopy();
  return [
    {
      id: plan.id,
      name: { en: plan.name_en, it: plan.name_it },
      price: {
        monthly: { usd: +(plan.monthly_eur * 1.1).toFixed(2), eur: plan.monthly_eur, crypto: 0 },
        annually: { usd: +(plan.annually_eur * 1.1).toFixed(2), eur: plan.annually_eur, crypto: 0 },
      },
      features: {
        en: plan.features_en,
        it: plan.features_it,
      },
      isPopular: true,
    },
  ];
}
