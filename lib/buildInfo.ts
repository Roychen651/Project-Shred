// Sprint 45 — the build tag used to live as a visible pill next to the
// PROJECT SHRED wordmark in the main header (Sprint 27-44). That caught
// several real stale-Vercel-deployment incidents this session (Sprints 38,
// 41, 43) — a genuinely useful diagnostic — but showing an internal
// sprint-numbered build string on the primary end-user screen reads as
// unfinished/internal-tooling-leaking-into-production, a fair brand
// complaint on its own. The diagnostic value is kept, just relocated:
// this single constant now surfaces in exactly two low-visibility places —
// a quiet footer line in Settings (the same "Settings → About → version"
// spot virtually every consumer app uses) and a one-time console.log on
// mount — instead of the main dashboard next to the logo.
export const BUILD_TAG = 'v4.7.0';
