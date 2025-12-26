export const PRICING_TIERS = {
  combo: {
    1: 250000,
    2: 400000,
    3: 500000,
    5: 500000, // Deal: same price as 3 months
    12: 1800000,
    13: 1800000, // Deal: 13 months = 12 months price
  },
  single: {
    2: 200000,
    3: 300000,
    6: 500000, // Deal: best value for single skill
    12: 900000,
  },
} as const;

export type PackageType = "combo" | "single";
export type SkillType = "listening" | "reading";

export interface SubscriptionSelection {
  packageType: PackageType;
  skillType?: SkillType;
  duration: number;
  totalPrice: number;
}

/**
 * Get price for a given package type and duration
 * Falls back to nearest lower tier if exact match not found
 * Or calculates dynamically if basePrice and monthlyIncrementPrice are provided
 */
export function calculatePrice(
  packageType: PackageType,
  duration: number,
  basePrice?: number,
  monthlyIncrementPrice?: number
): number | null {
  // Single-skill plans must be at least 2 months
  if (packageType === "single" && duration < 1) {
    return null;
  }
  if (packageType === "combo" && duration < 1) {
    return null;
  }

  // If basePrice and monthlyIncrementPrice are provided, calculate dynamically
  if (basePrice !== undefined && monthlyIncrementPrice !== undefined) {
    return basePrice + (duration - 1) * monthlyIncrementPrice;
  }

  // Fallback to static tiers
  const tiers = PRICING_TIERS[packageType];
  const price = tiers[duration as keyof typeof tiers];

  return price ?? null;
}

// Backward compatibility wrapper
export const getPrice = calculatePrice;

/**
 * Format price to VND currency
 */
export function formatPrice(price: number | null): string {
  if (price === null) return "N/A";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

