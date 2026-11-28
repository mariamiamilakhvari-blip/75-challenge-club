import { ChallengeSuggestion, SuggestionsResult } from '@/features/ai/types/suggestion.types';
import { AiSuggestionType, AiSuggestionsSchema } from '@/features/ai/validations/suggestion.validation';
import { UserDocument } from '@/features/auth/schema/user.schema';
import { profileRepository } from '@/features/profile/repository/profile.repository';
import { CHALLENGES, PresetChallenge } from '@/shared/const/challenge.const';
import {
  ALWAYS_SUGGESTED_KEYS,
  FALLBACK_FILLER_KEYS,
  FALLBACK_REASONS,
  INTEREST_CHALLENGE_MAP,
  MAX_REASON_LENGTH,
  MAX_SUGGESTIONS,
  MIN_SUGGESTIONS,
  SUGGESTION_CACHE_TTL_MS,
} from '@/shared/const/suggestion.const';
import { ChatMessage, openRouter } from '@/shared/lib/openrouter';
import { ServiceResult } from '@/shared/types/common';
import { initialDays, isRequired, normalizeDays } from '@/shared/utils/challenge-rules';

type CacheEntry = { result: SuggestionsResult; expiresAt: number };

const cache = new Map<string, CacheEntry>();

export function clearSuggestionCache(): void {
  cache.clear();
}

const OPTIONAL_CHALLENGES = CHALLENGES.filter((item) => !isRequired(item.key));

// only optional challenges can be suggested — required ones are always on
const titleOf = (key: string): string | null =>
  OPTIONAL_CHALLENGES.find((item) => item.key === key)?.title ?? null;

function truncate(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= MAX_REASON_LENGTH ? clean : `${clean.slice(0, MAX_REASON_LENGTH - 1).trimEnd()}…`;
}

function describeRule(preset: PresetChallenge): string {
  if (preset.kind === 'scheduled') {
    return `scheduled — exactly ${preset.requiredDays} weekday${preset.requiredDays === 1 ? '' : 's'}`;
  }
  if (preset.kind === 'monthly') return 'monthly allowance — all 7 days, one exception per month';
  return 'daily — all 7 days';
}

export function buildPrompt(user: UserDocument): ChatMessage[] {
  const required = CHALLENGES.filter((item) => isRequired(item.key))
    .map((item) => item.title)
    .join(', ');
  const presets = OPTIONAL_CHALLENGES.map((item) => `- ${item.key}: ${item.title} (${item.hint}) [${describeRule(item)}]`).join(
    '\n'
  );
  const interests = user.interests.length > 0 ? user.interests.join(', ') : 'not specified';
  const age = user.age ?? 'unknown';
  const city = user.city?.trim() || 'unknown';

  const system = [
    'You are a friendly habit coach for a 75-day group challenge app.',
    'Reply with ONLY a JSON object, no markdown, no commentary.',
  ].join(' ');

  const userPrompt = [
    `User profile — interests: ${interests}; age: ${age}; city: ${city}.`,
    '',
    `Every user already does these required challenges: ${required}. Do NOT suggest them.`,
    `Pick ${MIN_SUGGESTIONS} extra optional challenges for this user ` +
      `(never fewer than ${MIN_SUGGESTIONS}, at most ${MAX_SUGGESTIONS}), using ONLY these preset keys:`,
    presets,
    '',
    'Days are weekday integers where 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun. Follow each rule exactly:',
    '- daily challenges are fixed to all 7 days: [0,1,2,3,4,5,6].',
    '- scheduled challenges must have EXACTLY the stated number of weekdays — choose days that fit the habit',
    '  (spread workouts with rest days between, social usually on a weekend day).',
    '- monthly allowance challenges are followed every day ([0,1,2,3,4,5,6]) with one exception allowed per month.',
    `Give a short, warm reason (max ${MAX_REASON_LENGTH} characters) tied to their interests.`,
    '',
    'Respond exactly in this shape:',
    '{"suggestions":[{"key":"meditate","days":[0,1,2,3,4,5,6],"reason":"..."},{"key":"skill","days":[0,1,3,4],"reason":"..."}]}',
  ].join('\n');

  return [
    { role: 'system', content: system },
    { role: 'user', content: userPrompt },
  ];
}

export function extractJson(raw: string): string | null {
  const unfenced = raw.replace(/```(?:json)?/gi, '');
  const start = unfenced.indexOf('{');
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < unfenced.length; i += 1) {
    const char = unfenced[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) return unfenced.slice(start, i + 1);
    }
  }
  return null;
}

function normalize(items: AiSuggestionType[]): ChallengeSuggestion[] {
  const seen = new Set<string>();
  const result: ChallengeSuggestion[] = [];

  for (const item of items) {
    const key = item.key.trim().toLowerCase();
    const title = titleOf(key);
    if (!title || seen.has(key)) continue;

    const days = normalizeDays(key, item.days) ?? initialDays(key);
    const reason = truncate(item.reason) || FALLBACK_REASONS[key] || '';
    result.push({ key, title, days, reason });
    seen.add(key);
    if (result.length >= MAX_SUGGESTIONS) break;
  }

  return result;
}

export function parseSuggestions(raw: string | null): ChallengeSuggestion[] {
  if (!raw) return [];
  const json = extractJson(raw);
  if (!json) return [];

  try {
    const parsed = AiSuggestionsSchema.safeParse(JSON.parse(json));
    return parsed.success ? normalize(parsed.data.suggestions) : [];
  } catch {
    return [];
  }
}

export function fallbackSuggestions(interests: string[]): ChallengeSuggestion[] {
  const keys: string[] = [];
  for (const interest of interests) {
    const key = INTEREST_CHALLENGE_MAP[interest];
    if (key && !keys.includes(key)) keys.push(key);
  }
  const picked = keys
    .filter((key) => !ALWAYS_SUGGESTED_KEYS.includes(key))
    .slice(0, MAX_SUGGESTIONS - ALWAYS_SUGGESTED_KEYS.length);
  const ordered = [...picked, ...ALWAYS_SUGGESTED_KEYS.filter((key) => !picked.includes(key))];
  for (const key of FALLBACK_FILLER_KEYS) {
    if (ordered.length >= MIN_SUGGESTIONS) break;
    if (!ordered.includes(key)) ordered.push(key);
  }

  return ordered.flatMap((key) => {
    const title = titleOf(key);
    if (!title) return [];
    return [{ key, title, days: initialDays(key), reason: FALLBACK_REASONS[key] ?? '' }];
  });
}

export async function suggestChallengesService(userId: string): Promise<ServiceResult<SuggestionsResult>> {
  const cached = cache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return { data: cached.result, status: 200 };

  const user = await profileRepository.findById(userId);
  if (!user) return { data: { error: 'NOT_FOUND' }, status: 404 };

  const raw = await openRouter.chat(buildPrompt(user), { maxTokens: 700, temperature: 0.6 });
  const aiSuggestions = parseSuggestions(raw);

  const result: SuggestionsResult =
    aiSuggestions.length > 0
      ? { suggestions: aiSuggestions, source: 'ai' }
      : { suggestions: fallbackSuggestions(user.interests), source: 'fallback' };

  if (result.source === 'ai') cache.set(userId, { result, expiresAt: Date.now() + SUGGESTION_CACHE_TTL_MS });
  return { data: result, status: 200 };
}
