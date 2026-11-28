import { describe, expect, it } from 'vitest';

import { isJoinablePlan, normalizePlanDetails, planPrompt } from '@/shared/utils/plan-rules';

describe('plan rules', () => {
  it('has a question per special challenge and a default for the rest', () => {
    expect(planPrompt('social').question).toBe('Where are you planning to go?');
    expect(planPrompt('workout').question).toBe('Where and what are you training?');
    expect(planPrompt('read').question).toBe('What are you reading?');
    expect(planPrompt('water').question).toBe('Share a note with your team');
  });

  it('allows "I\'m in" only on social and workout plans', () => {
    expect(isJoinablePlan('social')).toBe(true);
    expect(isJoinablePlan('workout')).toBe(true);
    expect(isJoinablePlan('read')).toBe(false);
    expect(isJoinablePlan('custom-guitar-ab12')).toBe(false);
  });

  it('requires the prompt fields and drops fields the prompt does not ask for', () => {
    expect(normalizePlanDetails('workout', { place: 'Gym' })).toBeNull();
    expect(normalizePlanDetails('workout', { place: ' Gym ', activity: 'Yoga', book: 'ignored' })).toEqual({
      place: 'Gym', when: '', activity: 'Yoga', book: '', author: '', note: '',
    });
    expect(normalizePlanDetails('read', { author: 'Haig' })).toBeNull();
    expect(normalizePlanDetails('read', { book: 'Dune' })?.book).toBe('Dune');
    expect(normalizePlanDetails('social', { place: '  ' })).toBeNull();
    expect(normalizePlanDetails('water', { note: '' })).toBeNull();
    expect(normalizePlanDetails('water', { note: 'Bottle on desk' })?.note).toBe('Bottle on desk');
  });
});
