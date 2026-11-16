/**
 * CodeSense AI — Authoritative language capability registry.
 *
 * Single source of truth for which languages are review-enabled. Frontend
 * receives a safe public view. Syntax highlighting (Monaco) is NOT equivalent
 * to AI review support; each entry states both capabilities independently.
 */

const LANGUAGES = [
  {
    canonicalId: 'javascript',
    displayName: 'JavaScript',
    monacoId: 'javascript',
    reviewEnabled: true,
    staticAnalyzer: null,
    aiReviewSupported: true,
    sourceSizeLimitBytes: 64 * 1024,
    notes: 'AI-assisted review only. No deterministic compiler or lint integration.',
  },
  {
    canonicalId: 'typescript',
    displayName: 'TypeScript',
    monacoId: 'typescript',
    reviewEnabled: true,
    staticAnalyzer: null,
    aiReviewSupported: true,
    sourceSizeLimitBytes: 64 * 1024,
    notes: 'AI-assisted review only. No deterministic compiler or lint integration.',
  },
  {
    canonicalId: 'python',
    displayName: 'Python',
    monacoId: 'python',
    reviewEnabled: true,
    staticAnalyzer: null,
    aiReviewSupported: true,
    sourceSizeLimitBytes: 64 * 1024,
    notes: 'AI-assisted review only. No deterministic compiler or lint integration.',
  },
  {
    canonicalId: 'java',
    displayName: 'Java',
    monacoId: 'java',
    reviewEnabled: true,
    staticAnalyzer: null,
    aiReviewSupported: true,
    sourceSizeLimitBytes: 64 * 1024,
    notes: 'AI-assisted review only. No deterministic compiler or lint integration.',
  },
  {
    canonicalId: 'cpp',
    displayName: 'C++',
    monacoId: 'cpp',
    reviewEnabled: true,
    staticAnalyzer: null,
    aiReviewSupported: true,
    sourceSizeLimitBytes: 64 * 1024,
    notes: 'AI-assisted review only. No deterministic compiler or lint integration.',
  },
];

function getAll() {
  return LANGUAGES;
}

function getEnabledForReview() {
  return LANGUAGES.filter((l) => l.reviewEnabled && l.aiReviewSupported);
}

function findByCanonicalId(canonicalId) {
  return LANGUAGES.find((l) => l.canonicalId === canonicalId) || null;
}

function findByMonacoId(monacoId) {
  return LANGUAGES.find((l) => l.monacoId === monacoId) || null;
}

function isReviewEnabled(canonicalId) {
  const lang = findByCanonicalId(canonicalId);
  return !!(lang && lang.reviewEnabled && lang.aiReviewSupported);
}

// Public view: no internal notes/flags the client shouldn't set.
function publicView() {
  return LANGUAGES.map((l) => ({
    canonicalId: l.canonicalId,
    displayName: l.displayName,
    monacoId: l.monacoId,
    reviewEnabled: l.reviewEnabled,
    aiReviewSupported: l.aiReviewSupported,
  }));
}

module.exports = {
  LANGUAGES,
  getAll,
  getEnabledForReview,
  findByCanonicalId,
  findByMonacoId,
  isReviewEnabled,
  publicView,
};
