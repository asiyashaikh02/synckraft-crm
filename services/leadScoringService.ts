import type { Lead } from "../types";

export type AiCategory = "HOT" | "WARM" | "COLD";

export const computeLeadScore = (lead: Partial<Lead>) => {
  let score = 0;

  const monthlyUnits = Number(lead.monthlyUnits ?? 0);
  if (monthlyUnits > 0) {
    const capped = Math.min(monthlyUnits, 1500);
    score += (capped / 1500) * 40; // up to 40 points
  }

  const roofType = (lead.roofType || "").toUpperCase();
  if (roofType.includes("RCC")) {
    score += 20;
  } else if (roofType) {
    score += 10;
  }

  const followUpCount = Number(lead.followUpCount ?? 0);
  score += Math.min(followUpCount, 5) * 3; // up to 15

  const visitCount = Number(lead.visitCount ?? 0);
  score += Math.min(visitCount, 3) * 5; // up to 15

  const rtm = Number(lead.responseTimeMinutes ?? 0);
  if (rtm > 0) {
    if (rtm <= 30) score += 10;
    else if (rtm <= 120) score += 5;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let aiCategory: AiCategory = "COLD";
  if (score >= 70) aiCategory = "HOT";
  else if (score >= 40) aiCategory = "WARM";

  return { aiScore: score, aiCategory };
};

