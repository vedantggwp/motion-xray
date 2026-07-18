import acceptedWalk from './accepted-walk.json';
import insufficientEvidence from './insufficient-evidence.json';
import type { FixtureId, MotionFixture } from './schema';
import { FixtureSchemaError, validateFixture } from './schema';

const CACHE = new Map<string, MotionFixture>();

export function loadFixture(id: Exclude<FixtureId, 'live-camera' | 'local-video'>): MotionFixture {
  const cached = CACHE.get(id);
  if (cached) {
    return cached;
  }

  const raw = id === 'accepted-walk' ? acceptedWalk : insufficientEvidence;
  try {
    const fixture = validateFixture(raw);
    CACHE.set(id, fixture);
    return fixture;
  } catch (error) {
    if (error instanceof FixtureSchemaError) {
      throw error;
    }
    throw new FixtureSchemaError(
      error instanceof Error ? error.message : 'Unknown fixture load error',
    );
  }
}

export function listBundledFixtures(): Array<{
  id: Exclude<FixtureId, 'live-camera' | 'local-video'>;
  label: string;
}> {
  return [
    { id: 'accepted-walk', label: loadFixture('accepted-walk').label },
    { id: 'insufficient-evidence', label: loadFixture('insufficient-evidence').label },
  ];
}
