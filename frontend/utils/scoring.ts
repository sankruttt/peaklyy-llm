import { AIResumeProfile } from "../types";

export interface ATSEvaluationResult {
  score: number;
  formatting_score: number;
  impact_score: number;
  keywords_score: number;
  brevity_score: number;
  label: string;
  tier: string;
  color: string;
  feedback: string[];
}

const ACTION_VERBS = new Set([
  "architected", "engineered", "developed", "optimized", "scaled", "implemented",
  "spearheaded", "designed", "automated", "streamlined", "led", "built", "migrated",
  "reduced", "increased", "delivered", "orchestrated", "refactored", "resolved", "launched"
]);

/**
 * Evaluates resume against standard ATS (Applicant Tracking System) benchmarks:
 * - Formatting & Section Compliance (Max 25)
 * - Quantifiable Impact & Action Verbs (Max 25)
 * - Keyword & Technical Competency Density (Max 30)
 * - Brevity & Readability (Max 20)
 *
 * Uses backend ats_evaluation if available; otherwise computes dynamically client-side.
 */
export function calculateATSScore(profile?: AIResumeProfile | null): ATSEvaluationResult {
  if (!profile) {
    return {
      score: 0,
      formatting_score: 0,
      impact_score: 0,
      keywords_score: 0,
      brevity_score: 0,
      label: "NO RESUME INDEXED",
      tier: "LEVEL 0",
      color: "text-[#8e8c90]",
      feedback: ["Upload your resume to compute ATS compliance and keyword density."]
    };
  }

  // Check if backend ATS evaluation already exists
  const backendATS = profile.skills?.ats_evaluation;
  if (backendATS && typeof backendATS.score === "number") {
    const score = backendATS.score;
    const rating = getScoreRating(score);
    return {
      score: backendATS.score,
      formatting_score: backendATS.formatting_score ?? 20,
      impact_score: backendATS.impact_score ?? 18,
      keywords_score: backendATS.keywords_score ?? 22,
      brevity_score: backendATS.brevity_score ?? 16,
      label: backendATS.label || rating.label,
      tier: backendATS.tier || rating.tier,
      color: rating.color,
      feedback: backendATS.feedback && backendATS.feedback.length > 0 ? backendATS.feedback : [
        "Include more quantifiable metrics (%, $, latency) to strengthen impact scoring.",
        "Add targeted industry keywords directly aligned with high-match roles."
      ]
    };
  }

  // Client-side deterministic calculation
  let formatting_score = 0;
  let impact_score = 0;
  let keywords_score = 0;
  let brevity_score = 0;
  const feedback: string[] = [];

  // 1. Formatting & Section Compliance (Max 25 pts)
  if (profile.professional_summary && profile.professional_summary.trim().length > 30) {
    formatting_score += 5;
  } else {
    feedback.push("Add a targeted 2-3 sentence Professional Summary at the top of your resume.");
  }

  const experience = profile.experience || [];
  if (experience.length >= 1) {
    formatting_score += 8;
  } else {
    feedback.push("Ensure employment history includes clear job titles, companies, and date ranges.");
  }

  const skills = profile.skills || {};
  const totalCoreSkills =
    (skills.programming_languages?.length || 0) +
    (skills.frameworks?.length || 0) +
    (skills.databases?.length || 0) +
    (skills.tools?.length || 0) +
    (skills.technical_skills?.length || 0);

  if (totalCoreSkills >= 5) {
    formatting_score += 5;
  } else {
    feedback.push("Group your technical proficiencies under a dedicated Skills section.");
  }

  const education = profile.education || [];
  if (education.length >= 1) {
    formatting_score += 4;
  } else {
    feedback.push("Include your highest academic degree, institution, and field of study.");
  }

  const projects = profile.projects || [];
  const certs = profile.certifications || [];
  if (projects.length >= 1 || certs.length >= 1) {
    formatting_score += 3;
  }

  // 2. Impact Metrics & Action Verbs (Max 25 pts)
  const bulletTexts: string[] = [];
  experience.forEach((exp) => {
    if (exp.responsibilities) bulletTexts.push(...exp.responsibilities);
  });
  projects.forEach((proj) => {
    if (proj.description) bulletTexts.push(proj.description);
  });

  const fullTextSample = [
    profile.professional_summary || "",
    ...bulletTexts,
    ...(skills.technical_skills || []),
    ...(skills.tools || [])
  ].join(" ").toLowerCase();

  // Action verbs check
  const wordsFound = new Set(fullTextSample.match(/\b[a-z]{3,}\b/g) || []);
  let matchedVerbCount = 0;
  ACTION_VERBS.forEach((v) => {
    if (wordsFound.has(v)) matchedVerbCount++;
  });

  if (matchedVerbCount >= 6) impact_score += 10;
  else if (matchedVerbCount >= 3) impact_score += 7;
  else if (matchedVerbCount >= 1) impact_score += 4;
  else feedback.push("Begin bullet points with active engineering verbs (e.g., 'Architected', 'Optimized', 'Automated').");

  // Quantifiable metrics regex
  const metricMatches = fullTextSample.match(/\b\d+(?:\.\d+)?(?:%|\+|k|m|x|ms|s|gb|tb|tbps|users|req\/s|\$|₹)\b|\$\d+/g) || [];
  if (metricMatches.length >= 5) impact_score += 15;
  else if (metricMatches.length >= 3) impact_score += 11;
  else if (metricMatches.length >= 1) impact_score += 6;
  else feedback.push("Quantify your achievements with measurable metrics (e.g., 'Reduced latency by 40%', 'Scaled to 10k users').");

  // 3. Keyword Density & Hard Skills (Max 30 pts)
  if (totalCoreSkills >= 12) keywords_score += 20;
  else if (totalCoreSkills >= 8) keywords_score += 16;
  else if (totalCoreSkills >= 4) keywords_score += 11;
  else {
    keywords_score += 6;
    feedback.push("Increase coverage of specific technical keywords and tools relevant to target engineering roles.");
  }

  const proficiencies = skills.proficiencies || [];
  const strongestSkills = skills.strongest_skills || [];
  if (proficiencies.length >= 4 || strongestSkills.length >= 3) {
    keywords_score += 10;
  } else if (proficiencies.length >= 1 || strongestSkills.length >= 1) {
    keywords_score += 5;
  }

  // 4. Brevity & Readability (Max 20 pts)
  if (bulletTexts.length > 0) {
    const avgLen = bulletTexts.reduce((sum, b) => sum + b.length, 0) / bulletTexts.length;
    if (avgLen >= 30 && avgLen <= 220) brevity_score += 8;
    else brevity_score += 4;
  } else {
    brevity_score += 4;
  }

  // Word count balance
  const totalWordCount = fullTextSample.split(/\s+/).filter(Boolean).length;
  if (totalWordCount >= 250 && totalWordCount <= 900) {
    brevity_score += 12;
  } else if (totalWordCount > 900) {
    brevity_score += 6;
    feedback.push("Resume descriptions are long; tighten bullet points to 1-2 concise lines.");
  } else {
    brevity_score += 6;
  }

  const rawTotal = formatting_score + impact_score + keywords_score + brevity_score;
  const score = Math.min(100, Math.max(10, Math.round(rawTotal)));
  const rating = getScoreRating(score);

  return {
    score,
    formatting_score,
    impact_score,
    keywords_score,
    brevity_score,
    label: rating.label,
    tier: rating.tier,
    color: rating.color,
    feedback: feedback.slice(0, 3)
  };
}

/**
 * Calculates a dynamic, deterministic Resume ATS Score (0 - 100 PTS).
 * Compatible alias for calculateATSScore(profile).score.
 */
export function calculateResumeScore(profile?: AIResumeProfile | null): number {
  return calculateATSScore(profile).score;
}

/**
 * Returns a qualitative evaluation badge based on score
 */
export function getScoreRating(score: number): { label: string; color: string; tier: string } {
  if (score >= 85) return { label: "EXCELLENT ATS FIT", color: "text-emerald-400", tier: "TOP 5%" };
  if (score >= 70) return { label: "STRONG ATS FIT", color: "text-emerald-400", tier: "TOP 15%" };
  if (score >= 55) return { label: "MODERATE ATS FIT", color: "text-amber-400", tier: "MID TIER" };
  if (score > 0) return { label: "NEEDS OPTIMIZATION", color: "text-orange-400", tier: "EARLY STAGE" };
  return { label: "NO ANALYSIS", color: "text-[#8e8c90]", tier: "--" };
}
