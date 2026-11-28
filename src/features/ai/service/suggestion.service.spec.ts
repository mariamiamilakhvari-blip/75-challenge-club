import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildPrompt,
  clearSuggestionCache,
  extractJson,
  fallbackSuggestions,
  suggestChallengesService,
} from '@/features/ai/service/suggestion.service';
import { UserDocument } from '@/features/auth/schema/user.schema';
import { profileRepository } from '@/features/profile/repository/profile.repository';
import { openRouter } from '@/shared/lib/openrouter';

vi.mock('@/features/profile/repository/profile.repository');
vi.mock('@/shared/lib/openrouter', () => ({ openRouter: { chat: vi.fn() } }));

const userId = '507f1f77bcf86cd799439011';

const baseUser = {
  _id: new mongoose.Types.ObjectId(userId),
  name: 'Nino',
  email: 'n@x.io',
  age: 27,
  city: 'Tbilisi',
  interests: ['Yoga', 'Books'],
  timezone: 'UTC',
  published: false,
  teamId: null,
  challenges: [{ key: 'water', title: 'Drink 2 L of water', custom: false, days: [0, 1, 2] }],
  streakStart: '',
  lastEvaluated: '',
} as UserDocument;

describe('suggestion.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSuggestionCache();
    vi.mocked(profileRepository.findById).mockResolvedValue(baseUser);
  });

  it('returns 404 when user missing', async () => {
    vi.mocked(profileRepository.findById).mockResolvedValueOnce(null);
    const result = await suggestChallengesService(userId);
    expect(result).toEqual({ data: { error: 'NOT_FOUND' }, status: 404 });
    expect(openRouter.chat).not.toHaveBeenCalled();
  });

  it('parses fenced AI output, keeps only optional keys, dedupes and normalizes days to the rules', async () => {
    vi.mocked(openRouter.chat).mockResolvedValueOnce(
      [
        'Sure! Here you go:',
        '```json',
        JSON.stringify({
          suggestions: [
            { key: 'skill', days: [4, 0, 2, 2, 9, -1], reason: 'You love yoga {flow}' },
            { key: 'surfing', days: [1], reason: 'nope' },
            { key: 'skill', days: [1], reason: 'dupe' },
            { key: 'water', days: [0, 1, 2, 3, 4, 5, 6], reason: 'required, dropped' },
            { key: 'workout', days: [0, 2, 4, 5], reason: 'required, dropped' },
            { key: 'meditate', days: [], reason: 'daily ignores days' },
            { key: 'sleep', days: [6, 0, 1, 2, 3], reason: 'x'.repeat(200) },
            { key: 'doomscroll', days: [], reason: 'over the max' },
          ],
        }),
        '```',
      ].join('\n')
    );

    const result = await suggestChallengesService(userId);
    expect(result.status).toBe(200);
    expect(result.data).toMatchObject({ source: 'ai' });
    const data = result.data as { suggestions: { key: string; title: string; days: number[]; reason: string }[] };
    expect(data.suggestions.map((item) => item.key)).toEqual(['skill', 'meditate', 'sleep']);
    expect(data.suggestions[0]).toEqual({
      key: 'skill',
      title: 'Learn a new skill 30 min',
      days: [0, 1, 3, 4],
      reason: 'You love yoga {flow}',
    });
    expect(data.suggestions[1].days).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(data.suggestions[2].days).toEqual([0, 1, 2, 3, 6]);
    expect(data.suggestions[2].reason.length).toBeLessThanOrEqual(80);
  });

  it('falls back when AI output only names required challenges', async () => {
    vi.mocked(openRouter.chat).mockResolvedValueOnce('{"suggestions":[{"key":"water","days":[],"reason":"x"}]}');
    const result = await suggestChallengesService(userId);
    expect(result.data).toMatchObject({ source: 'fallback' });
  });

  it('falls back when AI returns null', async () => {
    vi.mocked(openRouter.chat).mockResolvedValueOnce(null);
    const result = await suggestChallengesService(userId);
    expect(result.status).toBe(200);
    const data = result.data as { source: string; suggestions: { key: string }[] };
    expect(data.source).toBe('fallback');
    expect(data.suggestions.map((item) => item.key)).toEqual(['meditate', 'doomscroll', 'sleep']);
  });

  it('falls back when AI output has no valid suggestions', async () => {
    vi.mocked(openRouter.chat).mockResolvedValueOnce('{"suggestions":[{"key":"surfing","days":[1]}]}');
    const result = await suggestChallengesService(userId);
    expect(result.data).toMatchObject({ source: 'fallback' });
  });

  it('falls back on non-JSON text', async () => {
    vi.mocked(openRouter.chat).mockResolvedValueOnce('I cannot help with that {broken');
    const result = await suggestChallengesService(userId);
    expect(result.data).toMatchObject({ source: 'fallback' });
  });

  it('caches AI results per user', async () => {
    vi.mocked(openRouter.chat).mockResolvedValue('{"suggestions":[{"key":"meditate","days":[0,1],"reason":"Calm!"}]}');
    await suggestChallengesService(userId);
    const second = await suggestChallengesService(userId);
    expect(openRouter.chat).toHaveBeenCalledTimes(1);
    expect(profileRepository.findById).toHaveBeenCalledTimes(1);
    expect(second.data).toMatchObject({ source: 'ai' });
  });

  it('builds a prompt listing preset keys and the user profile', () => {
    const [, user] = buildPrompt(baseUser);
    expect(user.content).toContain('Yoga, Books');
    expect(user.content).toContain('Tbilisi');
    expect(user.content).toContain('no-alcohol: No alcohol');
    expect(user.content).toContain('exactly 4 weekdays');
    expect(user.content).toContain('Pick 2 extra optional challenges');
    expect(user.content).toContain('Do NOT suggest them');
    expect(user.content).not.toContain('- workout:');
    expect(user.content).not.toContain('- water:');
  });

  it('extracts the first balanced JSON object', () => {
    expect(extractJson('text {"a":{"b":"}"}} trailing {"c":1}')).toBe('{"a":{"b":"}"}}');
    expect(extractJson('no json here')).toBeNull();
  });

  it('fallback has 2–3 optional picks including sleep, never a required one', () => {
    const keys = fallbackSuggestions([]).map((item) => item.key);
    expect(keys).toEqual(['sleep', 'meditate']);
    const many = fallbackSuggestions(['Fitness', 'Books', 'Mindfulness', 'Tech', 'Travel']).map((item) => item.key);
    expect(many).toEqual(['doomscroll', 'meditate', 'sleep']);
    for (const key of many) expect(['water', 'workout', 'no-junk', 'read', 'social']).not.toContain(key);
  });

  it('fallback days follow the challenge rules', () => {
    const byKey = Object.fromEntries(fallbackSuggestions(['Tech']).map((item) => [item.key, item.days]));
    expect(byKey.sleep).toHaveLength(5);
    expect(byKey.skill).toHaveLength(4);
  });
});
