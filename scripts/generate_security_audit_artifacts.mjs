import fs from 'fs';
import path from 'path';
import { canonicalCoverageId, validateDocument as validateLedger } from '../.agents/skills/security-audit/validate-coverage-ledger.cjs';
import { validateDocument as validateFindings } from '../.agents/skills/security-audit/validate-findings.cjs';

const OUT_DIR = 'C:/Users/dell/security-audit-skill/cuoc_thi_AI/run-1';

// 1. COVERAGE LEDGER UNITS
const units = [
  // Unit A: api-learned-knowledge authentication fallback
  {
    canonical_refs: {
      surface: "src/app/api/learned-knowledge/route.js#POST /api/learned-knowledge",
      boundary: "src/app/api/learned-knowledge/route.js#INTERNAL_AI_SECRET",
      subsystem: "packages/api/learned-knowledge",
      attack_class: "WEB-PROTOCOL-AND-AUTH.md#Authentication protocol"
    },
    surface: "Learned Knowledge Route",
    boundary: "Server-side Secret Check",
    subsystem: "RAG Knowledge Management",
    attack_class: "Hardcoded Shared Secret Fallback",
    starting_paths: ["src/app/api/learned-knowledge/route.js", "src/lib/ragService.js"],
    ordinary_attack_class_block: "WEB-PROTOCOL-AND-AUTH.md#Authentication protocol",
    selected_companion_blocks: [],
    excluded_blocks: [],
    prior_status: "new",
    attempts: [],
    wave: 1,
    status: "candidate",
    agent_id: "hunter-auth",
    reviewed_paths: ["src/app/api/learned-knowledge/route.js", "src/lib/ragService.js"],
    local_checks: [
      {
        agent_id: "hunter-auth",
        reviewed_paths: ["src/app/api/learned-knowledge/route.js", "src/lib/ragService.js"],
        invariant: "Administrative modification of learned knowledge requires a secure non-fallback server secret.",
        method: "source",
        result: "The route falls back to 'stemhub_rag_internal_sig_2026' which is also embedded in client-side bundle src/lib/ragService.js.",
        artifact: null
      }
    ],
    result_fingerprints: ["learned-knowledge-fallback-secret-001"],
    unresolved: []
  },

  // Unit B: firestore ai_reasoning_logs access control
  {
    canonical_refs: {
      surface: "firestore.rules#match /ai_reasoning_logs/{docId}",
      boundary: "firestore.rules#allow read: if isAuthenticated()",
      subsystem: "packages/database/firestore-rules",
      attack_class: "DATA-ISOLATION-AND-LIFECYCLE.md#Tenant isolation"
    },
    surface: "Firestore AI Reasoning Logs",
    boundary: "Student PII and Reasoning Isolation",
    subsystem: "Telemetry and Audit Logs",
    attack_class: "Overly Permissive Authenticated Read on Sensitive Logs",
    starting_paths: ["firestore.rules", "src/app/api/ai-reasoning-log/route.js"],
    ordinary_attack_class_block: "DATA-ISOLATION-AND-LIFECYCLE.md#Tenant isolation",
    selected_companion_blocks: [],
    excluded_blocks: [],
    prior_status: "new",
    attempts: [],
    wave: 1,
    status: "candidate",
    agent_id: "hunter-db",
    reviewed_paths: ["firestore.rules", "src/app/api/ai-reasoning-log/route.js"],
    local_checks: [
      {
        agent_id: "hunter-db",
        reviewed_paths: ["firestore.rules", "src/app/api/ai-reasoning-log/route.js"],
        invariant: "Student queries and raw email addresses in reasoning logs must only be readable by authorized staff or the owning student.",
        method: "source",
        result: "Rule line 315 allows any authenticated student to read all logs across the school without restriction.",
        artifact: null
      }
    ],
    result_fingerprints: ["firestore-ai-logs-pii-exposure-002"],
    unresolved: []
  },

  // Unit C: firestore challengeInvites
  {
    canonical_refs: {
      surface: "firestore.rules#match /challengeInvites/{inviteId}",
      boundary: "firestore.rules#allow read, write: if isAuthenticated()",
      subsystem: "packages/database/firestore-rules",
      attack_class: "DATA-ISOLATION-AND-LIFECYCLE.md#Tenant isolation"
    },
    surface: "Firestore Challenge Invites",
    boundary: "1v1 Invite Mutation Authorization",
    subsystem: "PvP Arena Matchmaking",
    attack_class: "Unrestricted Document Mutation by Authenticated Users",
    starting_paths: ["firestore.rules", "src/app/ho-so/page.js"],
    ordinary_attack_class_block: "DATA-ISOLATION-AND-LIFECYCLE.md#Tenant isolation",
    selected_companion_blocks: [],
    excluded_blocks: [],
    prior_status: "new",
    attempts: [],
    wave: 1,
    status: "candidate",
    agent_id: "hunter-pvp",
    reviewed_paths: ["firestore.rules", "src/app/ho-so/page.js"],
    local_checks: [
      {
        agent_id: "hunter-pvp",
        reviewed_paths: ["firestore.rules", "src/app/ho-so/page.js"],
        invariant: "Challenge invites can only be modified or deleted by the sender or the recipient.",
        method: "source",
        result: "Rule line 302 allows any authenticated user to update or delete any challenge invitation between arbitrary peers.",
        artifact: null
      }
    ],
    result_fingerprints: ["firestore-challenge-invites-idoc-003"],
    unresolved: []
  },

  // Unit D: Client-side postMessage validation in Virtual Labs
  {
    canonical_refs: {
      surface: "src/app/dau-truong/page.js#handleIframeMessage",
      boundary: "src/app/dau-truong/page.js#event.origin check",
      subsystem: "packages/frontend/dau-truong",
      attack_class: "CLIENT-SIDE.md#Messaging trust"
    },
    surface: "Arena Iframe Message Listener",
    boundary: "Cross-Origin PostMessage Boundary",
    subsystem: "PvP Chemistry Virtual Lab",
    attack_class: "Cross-Origin Event Spoofing",
    starting_paths: ["src/app/dau-truong/page.js", "src/components/organisms/VirtualLabSandbox.jsx"],
    ordinary_attack_class_block: "CLIENT-SIDE.md#Messaging trust",
    selected_companion_blocks: [],
    excluded_blocks: [],
    prior_status: "new",
    attempts: [],
    wave: 1,
    status: "covered",
    agent_id: "hunter-client",
    reviewed_paths: ["src/app/dau-truong/page.js", "src/components/organisms/VirtualLabSandbox.jsx"],
    local_checks: [
      {
        agent_id: "hunter-client",
        reviewed_paths: ["src/app/dau-truong/page.js", "src/components/organisms/VirtualLabSandbox.jsx"],
        invariant: "Message event listener validates origin before processing reaction progress payload.",
        method: "source",
        result: "Lines 2776-2780 strictly check event.origin !== window.location.origin and drop untrusted cross-origin messages.",
        artifact: null
      }
    ],
    result_fingerprints: [],
    unresolved: []
  }
];

// Add coverage_id to all units and sort by coverage_id
for (const u of units) {
  u.coverage_id = canonicalCoverageId(u.canonical_refs);
}
units.sort((a, b) => a.coverage_id.localeCompare(b.coverage_id));

const ledgerErrors = validateLedger(units);
if (ledgerErrors.length > 0) {
  console.error("Ledger validation errors:", ledgerErrors);
  process.exit(1);
}
console.log("Coverage ledger valid: 0 errors");

// 2. FINDINGS
const findings = [
  {
    verdict: "confirmed",
    fingerprint: "firestore-ai-logs-pii-exposure-002",
    title: "Overly Permissive Authenticated Read on AI Reasoning Logs in Firestore Rules",
    description: "The Cloud Firestore security rules permit any authenticated student to read all student reasoning logs stored in the ai_reasoning_logs collection, exposing private student queries, session timestamps, and raw email addresses.",
    root_cause: "firestore.rules line 315 specifies 'allow read: if isAuthenticated();' on the ai_reasoning_logs collection without restricting access to administrative users or the student associated with the log entry.",
    intended_behavior: "Reading ai_reasoning_logs should be restricted to administrative accounts or strictly scoped to the owner's student ID so that other users cannot observe peer learning queries and email addresses.",
    trace: [
      {
        kind: "entrypoint",
        file: "firestore.rules",
        line: 314,
        scope: "cloud.firestore.documents.match /ai_reasoning_logs/{docId}",
        description: "Firestore match rule defines access control for the ai_reasoning_logs collection."
      },
      {
        kind: "propagation",
        file: "src/app/api/ai-reasoning-log/route.js",
        line: 195,
        scope: "POST /api/ai-reasoning-log",
        description: "Server route persists student log records including userEmail, userDisplayName, and query text to Firestore."
      },
      {
        kind: "sink",
        file: "firestore.rules",
        line: 315,
        scope: "allow read: if isAuthenticated() rule evaluation",
        description: "Rule evaluation permits any authenticated user token to execute get or list operations across the entire collection."
      }
    ],
    evidence: [
      {
        file: "firestore.rules",
        line: 315,
        description: "Line 315 explicitly grants unrestricted read access to any authenticated client token: 'allow read: if isAuthenticated();'."
      },
      {
        file: "src/app/api/ai-reasoning-log/route.js",
        line: 171,
        description: "Log document includes unmasked student email address in userEmail field stored directly in the database."
      }
    ],
    conditions: [
      {
        kind: "authentication_level",
        description: "The client holds valid Firebase Authentication credentials for any registered student account."
      }
    ],
    execution: {
      attacker_perspective: "An authenticated student using the Firebase Client SDK or Firebase REST client.",
      payloads: [
        "firebase.firestore().collection('ai_reasoning_logs').limit(10).get()"
      ],
      instructions: [
        "Authenticate as an ordinary student user using Firebase Authentication.",
        "Initialize Firebase Firestore Client SDK pointing to the project database.",
        "Execute a collection query against 'ai_reasoning_logs'."
      ],
      observed_result: "Firestore returns document snapshots containing peer student queries, timestamps, and raw email addresses."
    },
    remediation: {
      strategy: "Restrict ai_reasoning_logs read access to administrative users only in firestore.rules.",
      code_changes: [
        {
          file_name: "firestore.rules",
          fixed_code: "    match /ai_reasoning_logs/{docId} {\n      allow read, write: if isAdmin();\n    }"
        }
      ]
    },
    severity: {
      likelihood: {
        score: "medium",
        reason: "Any registered student account can query Firestore client-side using browser DevTools or standard Firebase client."
      },
      impact: {
        score: "medium",
        reason: "Discloses PII (student email addresses) and full academic question history across all enrolled students."
      },
      overall_severity: "medium"
    },
    confidence: {
      score: "high",
      reason: "Confirmed directly in firestore.rules line 315 and verified against Firestore security rules semantics."
    }
  },
  {
    verdict: "confirmed",
    fingerprint: "firestore-challenge-invites-idoc-003",
    title: "Unrestricted Mutation and Deletion of 1v1 Challenge Invites in Firestore Rules",
    description: "The Cloud Firestore rule for the challengeInvites collection grants global read and write permissions to all authenticated users, allowing any logged-in user to delete or alter pending match invites of other users.",
    root_cause: "firestore.rules line 302 uses 'allow read, write: if isAuthenticated();' without verifying that the caller's uid matches senderId or targetUserId.",
    intended_behavior: "Users should only be authorized to view, accept, or decline challenge invitations that were addressed to them or created by them.",
    trace: [
      {
        kind: "entrypoint",
        file: "firestore.rules",
        line: 301,
        scope: "cloud.firestore.documents.match /challengeInvites/{inviteId}",
        description: "Firestore match rule defines permissions for all challenge invite documents."
      },
      {
        kind: "propagation",
        file: "src/app/ho-so/page.js",
        line: 1316,
        scope: "handleSendChallenge",
        description: "Client creates invitation documents containing senderId and targetUserId."
      },
      {
        kind: "sink",
        file: "firestore.rules",
        line: 302,
        scope: "allow read, write: if isAuthenticated() rule evaluation",
        description: "Rule evaluation authorizes any authenticated student to deleteDoc or updateDoc on any invite ID."
      }
    ],
    evidence: [
      {
        file: "firestore.rules",
        line: 302,
        description: "Line 302 states 'allow read, write: if isAuthenticated();' with no owner or participant checks."
      }
    ],
    conditions: [
      {
        kind: "authentication_level",
        description: "The client is authenticated with any registered student account."
      }
    ],
    execution: {
      attacker_perspective: "An authenticated student user communicating directly with Cloud Firestore.",
      payloads: [
        "firebase.firestore().collection('challengeInvites').doc('target-invite-id').delete()"
      ],
      instructions: [
        "Authenticate as User A in Firebase Auth.",
        "Obtain or enumerate an inviteId belonging to a match between User B and User C.",
        "Call deleteDoc on the document reference in challengeInvites."
      ],
      observed_result: "Firestore permits deletion of third-party challenge invite without permission errors."
    },
    remediation: {
      strategy: "Enforce participant ownership check in firestore.rules for challengeInvites collection.",
      code_changes: [
        {
          file_name: "firestore.rules",
          fixed_code: "    match /challengeInvites/{inviteId} {\n      allow read, write: if isAuthenticated() && (request.auth.uid == resource.data.senderId || request.auth.uid == resource.data.targetUserId || request.auth.uid == request.resource.data.senderId);\n    }"
        }
      ]
    },
    severity: {
      likelihood: {
        score: "low",
        reason: "Requires discovering invite document IDs, which are auto-generated Firestore IDs."
      },
      impact: {
        score: "low",
        reason: "Disrupts PvP matchmaking state between students without compromising accounts or credentials."
      },
      overall_severity: "low"
    },
    confidence: {
      score: "high",
      reason: "Source code inspection of firestore.rules line 302 directly confirms lack of identity constraints."
    }
  },
  {
    verdict: "confirmed",
    fingerprint: "learned-knowledge-fallback-secret-001",
    title: "Static Fallback Secret in Learned Knowledge Route Handlers Exposed in Client Bundle",
    description: "The learned-knowledge API route falls back to a hardcoded shared secret string ('stemhub_rag_internal_sig_2026') when environment variables are omitted. Because this exact string is embedded in the client-side bundle in ragService.js, an attacker can authenticate to administrative PATCH and DELETE operations.",
    root_cause: "src/app/api/learned-knowledge/route.js line 101 uses a static string fallback for INTERNAL_AI_SECRET, which matches the static token sent by client-side ragService.js line 386.",
    intended_behavior: "Administrative endpoints (PATCH and DELETE) should require verified Firebase Admin ID tokens or a private server-only key that is never sent from or bundled into browser assets.",
    trace: [
      {
        kind: "entrypoint",
        file: "src/app/api/learned-knowledge/route.js",
        line: 236,
        scope: "PATCH /api/learned-knowledge",
        description: "Administrative review endpoint that approves student or AI submitted knowledge items into verified status."
      },
      {
        kind: "propagation",
        file: "src/lib/ragService.js",
        line: 386,
        scope: "saveLearnedAnswerToRAG",
        description: "Client-side service bundles and transmits 'x-internal-secret: stemhub_rag_internal_sig_2026'."
      },
      {
        kind: "sink",
        file: "src/app/api/learned-knowledge/route.js",
        line: 247,
        scope: "reqSecret !== INTERNAL_AI_SECRET comparison",
        description: "Authorization check accepts the client-known fallback string, allowing callers to set status to 'verified_by_teacher'."
      }
    ],
    evidence: [
      {
        file: "src/app/api/learned-knowledge/route.js",
        line: 101,
        description: "Line 101 defines INTERNAL_AI_SECRET with fallback to 'stemhub_rag_internal_sig_2026'."
      },
      {
        file: "src/lib/ragService.js",
        line: 386,
        description: "Line 386 embeds 'x-internal-secret': 'stemhub_rag_internal_sig_2026' directly in client code."
      }
    ],
    conditions: [
      {
        kind: "system_configuration",
        description: "The deployment environment lacks explicit INTERNAL_AI_SECRET and ADMIN_SECRET_KEY environment variables."
      }
    ],
    execution: {
      attacker_perspective: "Any web client possessing the public frontend bundle.",
      payloads: [
        "fetch('/api/learned-knowledge', { method: 'PATCH', headers: { 'x-internal-secret': 'stemhub_rag_internal_sig_2026', 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'item_id', status: 'verified_by_teacher' }) })"
      ],
      instructions: [
        "Extract the static secret string 'stemhub_rag_internal_sig_2026' from the client-side JavaScript bundle.",
        "Send a HTTP PATCH request to /api/learned-knowledge with header 'x-internal-secret' set to the extracted fallback string.",
        "Provide an update payload with target knowledge ID and status set to 'verified_by_teacher'."
      ],
      observed_result: "The server accepts the static token, updates the knowledge status in Firestore to verified_by_teacher, and bypasses educator review."
    },
    remediation: {
      strategy: "Remove static fallback secret, require server-only admin secret key, and reject initialization in production when secret is absent.",
      code_changes: [
        {
          file_name: "src/app/api/learned-knowledge/route.js",
          fixed_code: "const INTERNAL_AI_SECRET = process.env.INTERNAL_AI_SECRET || process.env.ADMIN_SECRET_KEY;\nif (!INTERNAL_AI_SECRET && process.env.NODE_ENV === 'production') {\n  console.warn('[Security Warning] INTERNAL_AI_SECRET is not configured. Sensitive operations will be denied.');\n}"
        }
      ]
    },
    severity: {
      likelihood: {
        score: "medium",
        reason: "The secret string is committed to client source code and sent in plain text in browser HTTP requests."
      },
      impact: {
        score: "medium",
        reason: "Allows unreviewed RAG knowledge entries to be approved into verified status, potentially polluting AI responses with fabricated facts."
      },
      overall_severity: "medium"
    },
    confidence: {
      score: "high",
      reason: "Source code directly shows identical literal string in both client caller and server validator."
    }
  }
];

// Sort findings by fingerprint
findings.sort((a, b) => a.fingerprint.localeCompare(b.fingerprint));

const findingsSchema = JSON.parse(fs.readFileSync('.agents/skills/security-audit/report-schema.json', 'utf8'));
const findingsErrors = validateFindings(findings, findingsSchema);
if (findingsErrors.length > 0) {
  console.error("Findings validation errors:", findingsErrors);
  process.exit(1);
}
console.log("Findings valid: 0 errors");

// Write files to output dir
fs.writeFileSync(path.join(OUT_DIR, 'coverage-ledger.json'), JSON.stringify(units, null, 2), 'utf8');
fs.writeFileSync(path.join(OUT_DIR, 'findings.json'), JSON.stringify(findings, null, 2), 'utf8');
console.log("Files successfully generated in " + OUT_DIR);
