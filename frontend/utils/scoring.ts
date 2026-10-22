import { AIResumeProfile } from "../types";

/**
 * Calculates a dynamic, deterministic Resume Strength Score (0 - 100 PTS)
 * based on verified candidate profile components:
 * - Professional Summary quality & depth (up to 15 PTS)
 * - Skills diversity & density across categories (up to 30 PTS)
 * - Work Experience duration, roles, and achievements (up to 25 PTS)
 * - Education & Certifications (up to 15 PTS)
 * - Practical Projects & Verified Strengths (up to 15 PTS)
 */
export function calculateResumeScore(profile?: AIResumeProfile | null): number {
  if (!profile) return 0;

  let score = 0;

  // 1. Professional Summary (Max 15 pts)
  if (profile.professional_summary) {
    const summaryLen = profile.professional_summary.trim().length;
    if (summaryLen > 120) score += 15;
    else if (summaryLen > 50) score += 10;
    else if (summaryLen > 10) score += 5;
  }

  // 2. Skills Diversity & Volume (Max 30 pts)
  const skills = profile.skills || {};
  const progLangs = skills.programming_languages?.length || 0;
  const frameworks = skills.frameworks?.length || 0;
  const databases = skills.databases?.length || 0;
  const tools = skills.tools?.length || 0;
  const techSkills = skills.technical_skills?.length || 0;
  const proficiencies = skills.proficiencies?.length || 0;

  const totalCoreSkills = progLangs + frameworks + databases + tools + techSkills;

  if (totalCoreSkills >= 12) score += 25;
  else if (totalCoreSkills >= 8) score += 20;
  else if (totalCoreSkills >= 4) score += 15;
  else if (totalCoreSkills > 0) score += 8;

  // Skill depth / proficiencies bonus (up to 5 pts)
  if (proficiencies >= 4 || (skills.strongest_skills && skills.strongest_skills.length >= 3)) {
    score += 5;
  } else if (proficiencies > 0) {
    score += 2;
  }

  // 3. Work Experience (Max 25 pts)
  const experiences = profile.experience || [];
  if (experiences.length >= 3) score += 18;
  else if (experiences.length === 2) score += 14;
  else if (experiences.length === 1) score += 10;

  // Detailed responsibilities or tech stack evidence (+7 pts)
  const hasDetailedWork = experiences.some(
    (exp) =>
      (exp.responsibilities && exp.responsibilities.length >= 2) ||
      (exp.technologies_used && exp.technologies_used.length >= 2)
  );
  if (hasDetailedWork) score += 7;

  // 4. Education & Certifications (Max 15 pts)
  const education = profile.education || [];
  if (education.length > 0) score += 10;

  const certifications = profile.certifications || [];
  if (certifications.length > 0) score += 5;

  // 5. Practical Projects & Verified Strengths (Max 15 pts)
  const projects = profile.projects || [];
  if (projects.length >= 2) score += 10;
  else if (projects.length === 1) score += 6;

  const strengths = profile.strengths || [];
  if (strengths.length >= 3) score += 5;
  else if (strengths.length > 0) score += 2;

  // Negative adjustment for critical weaknesses / missing items (if extensive)
  const weaknesses = profile.weaknesses || [];
  if (weaknesses.length > 4) {
    score -= 4;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Returns a qualitative evaluation badge based on score
 */
export function getScoreRating(score: number): { label: string; color: string; tier: string } {
  if (score >= 85) return { label: "OPTIMAL PROFILE", color: "text-emerald-400", tier: "TOP 5%" };
  if (score >= 70) return { label: "COMPETITIVE PROFILE", color: "text-emerald-400", tier: "TOP 15%" };
  if (score >= 55) return { label: "DEVELOPING PROFILE", color: "text-amber-400", tier: "MID TIER" };
  if (score > 0) return { label: "BASIC PROFILE", color: "text-orange-400", tier: "EARLY STAGE" };
  return { label: "NO ANALYSIS", color: "text-[#8e8c90]", tier: "--" };
}
