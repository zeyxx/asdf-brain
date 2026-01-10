# asdf-brain State Machine Diagrams

> Generated 2026-01-10 - Maps all paths including error handling and file dependencies.

## 1. Knowledge Ingestion Flow (brain_learn / brain_ingest)

```mermaid
stateDiagram-v2
    [*] --> ValidateInput

    ValidateInput --> CheckType: Valid input
    ValidateInput --> InputError: Invalid/empty

    InputError --> [*]

    CheckType --> ProjectDetection: Type recognized
    CheckType --> TypeValidationError: Unknown type

    TypeValidationError --> [*]

    ProjectDetection --> LanguageDetection: Project detected
    ProjectDetection --> DefaultProject: Fallback (ecosystem)

    LanguageDetection --> CreateEntry
    DefaultProject --> CreateEntry

    CreateEntry --> GenerateMetadata: Generate ID/hash

    GenerateMetadata --> CreateProvenance: Create provenance record

    CreateProvenance --> TrackContribution: Record contribution value

    TrackContribution --> EnrichProjectTags: Tag with project

    EnrichProjectTags --> EnrichLanguageTags: Tag with language

    EnrichLanguageTags --> UpdateEScore: Update contributor E-Score

    UpdateEScore --> WriteToStorage: Write to JSONL

    WriteToStorage --> StorageSuccess: Append successful
    WriteToStorage --> StorageError: Write fails

    StorageError --> ReturnError
    ReturnError --> [*]

    StorageSuccess --> UpdateProjectContext: Update project context

    UpdateProjectContext --> UpdateTemporal: Set initial strength=50

    UpdateTemporal --> ReturnSuccess: Return metadata

    ReturnSuccess --> [*]

    TrackContribution --> ContributionError: E-Score update fails
    ContributionError --> WriteToStorage: Continue (optional)
```

### Valid Types
- `insight` - Discovery or observation
- `pattern` - Recurring behavior
- `decision` - Architectural choice
- `error` - Bug or failure
- `intent` - Rationale/causality

### File Targets
```
knowledge/learned/live.jsonl        (append)
knowledge/ingested/{source}.jsonl   (append)
knowledge/burns/ledger.jsonl        (track)
knowledge/community/contributors.json (E-Score)
```

---

## 2. Search Flow (Query → PARDES → Results)

```mermaid
stateDiagram-v2
    [*] --> ParseQuery

    ParseQuery --> ValidateQuery: Query non-empty
    ValidateQuery --> FailEmpty: Empty query

    FailEmpty --> ReturnError
    ReturnError --> [*]

    ValidateQuery --> LanguageFilter: Language specified?

    LanguageFilter --> NoLangFilter: No filter
    LanguageFilter --> ApplyLangFilter: Filter by lang

    NoLangFilter --> OpenIndexFiles
    ApplyLangFilter --> OpenIndexFiles

    OpenIndexFiles --> LoadIndexPaths: Find JSONL files

    LoadIndexPaths --> CheckIndexExists: Index exists?

    CheckIndexExists --> IndexMissing: No index
    CheckIndexExists --> StreamLines: Begin streaming

    IndexMissing --> BuildIndexMessage: Suggest build
    BuildIndexMessage --> [*]

    StreamLines --> ParseLine: Read JSON line

    ParseLine --> ParseError: Malformed JSON
    ParseError --> SkipLine: Skip entry
    SkipLine --> StreamLines

    ParseLine --> ApplyLangFilter_LINE: Check lang filter

    ApplyLangFilter_LINE --> LangMismatch: Wrong language
    LangMismatch --> SkipLine

    ApplyLangFilter_LINE --> ExtractText: Extract searchable text

    ExtractText --> SplitTerms: Tokenize query

    SplitTerms --> ScoreEntry: Calculate term match

    ScoreEntry --> HighScore: score > 0
    ScoreEntry --> ZeroScore: score = 0

    HighScore --> AddResult: Accumulate result
    ZeroScore --> StreamLines

    AddResult --> LimitCheck: results < limit*10?

    LimitCheck --> True: Continue
    LimitCheck --> False: Stop

    True --> StreamLines
    False --> SortResults

    SortResults --> RankByScore: Sort descending

    RankByScore --> TakeTop: Select top N

    TakeTop --> CalculateQuality: K = 100*cbrt(D*O*L)

    CalculateQuality --> ApplyPhiWeight: Apply PARDES weight

    ApplyPhiWeight --> DetermineDaat: Auto-detect DAAT level

    DetermineDaat --> ApplyConfidence: Map to confidence

    ApplyConfidence --> SignResponse: HMAC sign response

    SignResponse --> ReturnResults: Return ranked results

    ReturnResults --> [*]
```

### PARDES Layers
| Layer | Meaning | Weight |
|-------|---------|--------|
| P (Pshat) | Direct/literal | 1.0 |
| R (Remez) | Pattern/hint | φ |
| D (Drash) | Philosophy | φ |
| S (Sod) | Secret/vision | φ⁻² |

### Confidence Tiers
| Threshold | Level | Action |
|-----------|-------|--------|
| > 61.8% (φ⁻¹) | ACT | High confidence |
| > 38.2% (φ⁻²) | VERIFY | Medium |
| < 23.6% (φ⁻³) | RESEARCH | Low |

### Index Files
```
index/cross-repo.jsonl
knowledge/learned/live.jsonl
knowledge/learned/transcripts.jsonl
knowledge/ingested/*.jsonl
```

---

## 3. Context Session Flow (Start → Inject → Update → End)

```mermaid
stateDiagram-v2
    [*] --> StartSession

    StartSession --> ValidateSessionInput: Input valid?

    ValidateSessionInput --> InputError_SESSION: Invalid
    InputError_SESSION --> [*]

    ValidateSessionInput --> GenerateSessionID: Create session ID

    GenerateSessionID --> DetectProject: Detect from context

    DetectProject --> ProjectKeywordMatch: Keyword matching

    ProjectKeywordMatch --> BestMatch: Find highest score
    BestMatch --> DefaultEcosystem: No match -> ecosystem

    DefaultEcosystem --> InitializeSession: Create session

    InitializeSession --> LoadPersisted: Load context

    LoadPersisted --> SessionActive: Session marked active

    SessionActive --> InjectContext

    InjectContext --> ValidateInject: Valid session?

    ValidateInject --> SessionNotFound: Not found
    SessionNotFound --> InjectError
    InjectError --> [*]

    ValidateInject --> LoadSessionContext: Get session

    LoadSessionContext --> BuildLayers

    BuildLayers --> LayerSession: Layer 1: Session (phi^2)
    LayerSession --> LayerProject: Layer 2: Project (phi)
    LayerProject --> LayerCross: Layer 3: Cross-project (1.0)
    LayerCross --> LayerPhilosophy: Layer 4: Philosophy (phi^-1)
    LayerPhilosophy --> LayerLearnings: Layer 5: Recent (1.0)

    LayerLearnings --> DaatDetection: Auto-detect DAAT

    DaatDetection --> DaatPassive: Level 1: PASSIVE
    DaatDetection --> DaatSuggestive: Level 2: SUGGESTIVE
    DaatDetection --> DaatActive: Level 3: ACTIVE
    DaatDetection --> DaatStrategic: Level 4: STRATEGIC

    DaatPassive --> CYNICJudgment
    DaatSuggestive --> CYNICJudgment
    DaatActive --> CYNICJudgment
    DaatStrategic --> CYNICJudgment

    CYNICJudgment --> ApplyCeilings: Max confidence 61.8%

    ApplyCeilings --> InjectComplete: Injection ready

    InjectComplete --> UpdateSession_STATE

    UpdateSession_STATE --> PushContext: Push to stack
    UpdateSession_STATE --> RecordDecision: Add decision
    UpdateSession_STATE --> TagPattern: Tag pattern
    UpdateSession_STATE --> CrossRef: Cross-reference

    PushContext --> ContextStackTrimmed: Keep last 50

    ContextStackTrimmed --> UpdateComplete: Session updated

    UpdateComplete --> EndSession_STATE: End session?

    EndSession_STATE --> ExtractLearnings: Extract learnings

    ExtractLearnings --> PersistLearnings: Append to recent

    PersistLearnings --> UpdateProjectContext_END: Update project

    UpdateProjectContext_END --> PersistProjectContext: Write to disk

    PersistProjectContext --> SessionTerminated: Session ended

    SessionTerminated --> [*]
```

### Context Layer Weights
| Layer | Weight | Purpose |
|-------|--------|---------|
| Session | φ² (2.618) | Current conversation |
| Project | φ (1.618) | Project-specific |
| Cross | 1.0 | Ecosystem relations |
| Philosophy | φ⁻¹ (0.618) | CYNIC axioms |
| Recent | 1.0 | Recent learnings |

### DAAT Levels (Kabbalah)
| Level | Name | Description |
|-------|------|-------------|
| 1 | PASSIVE | Facts only |
| 2 | SUGGESTIVE | Hints |
| 3 | ACTIVE | Full context |
| 4 | STRATEGIC | Ecosystem view |

---

## 4. Provenance Flow (Content → Merkle → Verification)

```mermaid
stateDiagram-v2
    [*] --> ContentIngested

    ContentIngested --> GenerateItemID: Create canonical ID

    GenerateItemID --> ContentHash: SHA256(content)

    ContentHash --> CreateProvenance_STATE: Create record

    CreateProvenance_STATE --> InitChain: Init chain=[created]

    InitChain --> SignProvenance: HMAC-SHA256 sign

    SignProvenance --> SaveProvenance: Write to registry

    SaveProvenance --> BuildPatternTree: Wait for batch

    BuildPatternTree --> ExtractHashes: Collect pattern hashes

    ExtractHashes --> SortHashes: Order for tree

    SortHashes --> BuildMerkleTree_STATE: Construct binary tree

    BuildMerkleTree_STATE --> ComputeLeaves: Hash leaf pairs

    ComputeLeaves --> ComputeParents: Hash parents

    ComputeParents --> ComputeRoot: Final root hash

    ComputeRoot --> GenerateProofs: Create per-pattern proof

    GenerateProofs --> MerkleRootReady: Root computed

    MerkleRootReady --> StoreMerkleState: Persist state

    StoreMerkleState --> TreeReady: Merkle tree ready

    TreeReady --> WeeklySnapshot: Weekly boundary?

    WeeklySnapshot --> CheckSnapshot: Recent snapshot?

    CheckSnapshot --> SnapshotFresh: < 24h old
    SnapshotFresh --> ProviderReady

    CheckSnapshot --> SnapshotStale: >= 24h old
    SnapshotStale --> GenerateSnapshot: Create snapshot

    GenerateSnapshot --> LoadAllPatterns: Read patterns

    LoadAllPatterns --> ComputeCombined: file_root + pattern_root

    ComputeCombined --> CreateSolanaPayload: Prepare chain data

    CreateSolanaPayload --> SaveSnapshot: Write week-{N}.json

    SaveSnapshot --> ProviderReady

    ProviderReady --> GetProofRequest: Proof requested

    GetProofRequest --> LookupProof: Find in proofs

    LookupProof --> ProofFound: Located
    LookupProof --> ProofNotFound: Not found

    ProofNotFound --> [*]

    ProofFound --> ReturnProof: Return leaf + path

    ReturnProof --> [*]

    ProviderReady --> VerifyRequest: Verification requested

    VerifyRequest --> LoadExpectedRoot: Get current root

    LoadExpectedRoot --> ComputeVerification: Recompute from leaf

    ComputeVerification --> HashPath: Hash up proof_path

    HashPath --> ReconstructRoot: Reconstruct root

    ReconstructRoot --> CompareRoots: Match expected?

    CompareRoots --> ProofValid: Match!
    CompareRoots --> ProofInvalid_VERIFY: Mismatch

    ProofValid --> ReturnValid: Verified
    ReturnValid --> [*]

    ProofInvalid_VERIFY --> ReturnInvalid: Unverified
    ReturnInvalid --> [*]
```

### Provenance Structure
```json
{
  "id": "16-char-hex",
  "content_hash": "SHA256",
  "source": "source_id",
  "contributor": "user_id",
  "timestamp": 1234567890,
  "chain": [
    {"action": "created", "hash": "...", "signer": "..."}
  ],
  "signature": "HMAC-SHA256"
}
```

### Merkle Tree Files
```
knowledge/provenance/merkle-state.json    (current state)
knowledge/provenance/registry.json        (all provenances)
knowledge/provenance/snapshots/week-{N}.json (weekly)
```

### Weekly Snapshot (Solana-ready)
```json
{
  "week_number": 2926,
  "timestamp": 1736510400000,
  "file_merkle_root": "...",
  "pattern_merkle_root": "...",
  "combined_root": "...",
  "statistics": {...},
  "solana_payload": {...}
}
```
