import { describe, it, expect } from 'vitest';
import { runIntegrityChecks } from '@/lib/domain/diagnostics';
import { computeProfileTargets } from '@/lib/domain/targets';

describe('runIntegrityChecks', () => {
  it('all 5 checks pass for a well-formed profile (cross-checked against targets.test.ts golden values)', () => {
    const profile = { weight: 84, height: 171, age: 29, activity: 'office' as const, goal: 'moderate' as const };
    const computed = computeProfileTargets(profile);
    const checks = runIntegrityChecks(profile, computed);

    expect(checks).toHaveLength(5);
    expect(checks.every((c) => c.pass)).toBe(true);

    // Independent cross-check of the golden BMR/TDEE values from targets.test.ts:
    // rebuilt = 168*4 + 59*9 + 282*4 = 672 + 531 + 1128 = 2331, 1kcal off restKcal
    // (2330) from rounding drift — within the 6kcal tolerance, and the same 1kcal
    // both directions is itself evidence the golden values are internally consistent.
    const restCheck = checks.find((c) => c.label.includes('יום מנוחה'));
    expect(restCheck?.detail).toContain('2331');
    expect(restCheck?.detail).toContain('פער: 1');
  });

  it('the refeed-delta check fails if training/rest ever drift from +300kcal/+75g', () => {
    const profile = { weight: 84, height: 171, age: 29 };
    const computed = computeProfileTargets(profile);
    const tampered = { ...computed, training: { ...computed.training, kcal: computed.training.kcal + 1 } };
    const checks = runIntegrityChecks(profile, tampered);
    const refeedCheck = checks.find((c) => c.label === 'דלתא Refeed מדויקת');
    expect(refeedCheck?.pass).toBe(false);
  });

  it('fails the profile-fields check for a zeroed-out profile', () => {
    const computed = computeProfileTargets({});
    const checks = runIntegrityChecks({ weight: 0, height: 0, age: 0 }, computed);
    expect(checks[0].pass).toBe(false);
  });
});
