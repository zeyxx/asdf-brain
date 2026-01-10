# GASdf State Machine Diagrams

> Generated 2026-01-10 - Maps all paths including error handling, retries, and external dependencies.

## 1. Quote Flow (Request → Quote ID)

```mermaid
stateDiagram-v2
    [*] --> RateLimitCheck

    RateLimitCheck --> AnomalyTracking: Request received
    RateLimitCheck --> RateLimitExceeded: Rate limit hit

    AnomalyTracking --> CircuitBreakerCheck

    CircuitBreakerCheck --> CircuitOpen: Circuit breaker active
    CircuitBreakerCheck --> TokenGateCheck: Circuit healthy

    CircuitOpen --> QuoteRejected_CircuitOpen: Return 503
    QuoteRejected_CircuitOpen --> [*]

    TokenGateCheck --> TokenAccepted: K-score >= 50
    TokenGateCheck --> TokenRejected: K-score < 50

    TokenRejected --> QuoteRejected_Token: Return 400
    QuoteRejected_Token --> [*]

    TokenAccepted --> PriorityFeeCalc: Helius SDK call

    PriorityFeeCalc --> PriorityFeeCalcSuccess: Real-time network fee
    PriorityFeeCalc --> PriorityFeeCalcError: Helius unreachable

    PriorityFeeCalcError --> FallbackFee: Use cached/default

    PriorityFeeCalcSuccess --> HolderTierCalc
    FallbackFee --> HolderTierCalc

    HolderTierCalc --> TierDetermined: Discount 0-95%

    TierDetermined --> JupiterPriceQuote: Get fee in payment token

    JupiterPriceQuote --> JupiterSuccess: Token price obtained
    JupiterPriceQuote --> JupiterError: Jupiter API failed

    JupiterError --> QuoteRejected_Jupiter: Return 500
    QuoteRejected_Jupiter --> [*]

    JupiterSuccess --> GenerateQuoteId: Create UUID

    GenerateQuoteId --> CalculateExpiry: TTL = 90 seconds

    CalculateExpiry --> FeePayerReservation: Mutex-protected reserve

    FeePayerReservation --> FeePayerAvailable: Balance available
    FeePayerReservation --> NoFeePayerCapacity: No healthy payer

    NoFeePayerCapacity --> QuoteRejected_Capacity: Return 503
    QuoteRejected_Capacity --> [*]

    FeePayerAvailable --> TreasuryATA: Ensure ATA exists

    TreasuryATA --> ATAExists: ATA ready
    TreasuryATA --> ATAError: ATA creation failed

    ATAError --> ATAOptional: Continue
    ATAExists --> ATAOptional

    ATAOptional --> RedisStore: Store quote metadata

    RedisStore --> AuditLog: Log quote creation

    AuditLog --> MetricsRecord: Record success metrics

    MetricsRecord --> QuoteResponse: Return quoteId + feePayer + feeAmount

    QuoteResponse --> [*]

    RateLimitExceeded --> QuoteRejected_RateLimit: Return 429
    QuoteRejected_RateLimit --> [*]
```

### Key Dependencies
- **Redis**: Quote storage, rate limiting
- **Helius**: Priority fee calculation
- **Jupiter**: Token pricing
- **HolDex**: K-score verification

---

## 2. Submit Flow (Transaction → Broadcast)

```mermaid
stateDiagram-v2
    [*] --> RateLimitCheck_Submit

    RateLimitCheck_Submit --> AnomalyTracking_Submit: Request received
    RateLimitCheck_Submit --> RateLimitExceeded_Submit: Rate limit hit

    RateLimitExceeded_Submit --> SubmitRejected_RateLimit: Return 429
    SubmitRejected_RateLimit --> [*]

    AnomalyTracking_Submit --> QuoteRetrieval: Get quote from Redis

    QuoteRetrieval --> QuoteFound: Quote exists
    QuoteRetrieval --> QuoteNotFound: Quote missing

    QuoteNotFound --> SubmitRejected_NotFound: Return 400
    SubmitRejected_NotFound --> [*]

    QuoteFound --> QuoteExpiry: Check expiration

    QuoteExpiry --> QuoteValid: Not expired
    QuoteExpiry --> QuoteExpired: TTL exceeded

    QuoteExpired --> QuoteDeleteRedis: Delete from Redis
    QuoteDeleteRedis --> SubmitRejected_Expired: Return 400
    SubmitRejected_Expired --> [*]

    QuoteValid --> TxSizeValidation: Max 1232 bytes

    TxSizeValidation --> SizePassed: Within limit
    TxSizeValidation --> SizeExceeded: Exceeds limit

    SizeExceeded --> SubmitRejected_Size: Return 400
    SubmitRejected_Size --> [*]

    SizePassed --> TxDeserialization: Parse versioned/legacy

    TxDeserialization --> Deserialized: Successfully parsed
    TxDeserialization --> DeserializeError: Invalid format

    DeserializeError --> SubmitRejected_Format: Return 400
    SubmitRejected_Format --> [*]

    Deserialized --> ReplayProtection: Compute tx hash (SET NX)

    ReplayProtection --> HashClaimed: First submission
    ReplayProtection --> HashExists: Duplicate detected

    HashExists --> SecurityEvent: Log replay attack
    SecurityEvent --> SubmitRejected_Replay: Return 400
    SubmitRejected_Replay --> [*]

    HashClaimed --> BlockhashValidation: Verify blockhash fresh

    BlockhashValidation --> BlockhashValid: Blockhash fresh
    BlockhashValidation --> BlockhashStale: Blockhash expired

    BlockhashStale --> SubmitRejected_Blockhash: Return 400
    SubmitRejected_Blockhash --> [*]

    BlockhashValid --> TxValidation: Fee payer + signatures

    TxValidation --> TxValid: All checks pass
    TxValidation --> TxInvalid: Validation failed

    TxInvalid --> SubmitRejected_TxValid: Return 400
    SubmitRejected_TxValid --> [*]

    TxValid --> FeePaymentValidation: Check fee instruction

    FeePaymentValidation --> FeePaymentValid: Correct amount
    FeePaymentValidation --> FeePaymentInvalid: Missing/incorrect

    FeePaymentInvalid --> SubmitRejected_FeePayment: Return 400
    SubmitRejected_FeePayment --> [*]

    FeePaymentValid --> TxSigning: Co-sign with fee payer

    TxSigning --> Signed: Signature added

    Signed --> TxSimulation: Simulate with balance check

    TxSimulation --> SimulationPass: CPI protection passed
    TxSimulation --> SimulationFail: Balance delta exceeded

    SimulationFail --> SubmitRejected_CPI: Return 400
    SubmitRejected_CPI --> [*]

    SimulationPass --> SendWithRetry: Send to network (3x retry)

    SendWithRetry --> SendAttempt1: Attempt 1

    SendAttempt1 --> Success1: Signature received
    SendAttempt1 --> Retryable1: Retryable error

    Retryable1 --> Backoff1: 500ms + jitter
    Backoff1 --> SendAttempt2: Attempt 2

    SendAttempt2 --> Success2: Signature received
    SendAttempt2 --> Retryable2: Retryable error

    Retryable2 --> Backoff2: 1000ms + jitter
    Backoff2 --> SendAttempt3: Attempt 3

    SendAttempt3 --> Success3: Signature received
    SendAttempt3 --> SendFailed: Final failure

    Success1 --> SendSuccess
    Success2 --> SendSuccess
    Success3 --> SendSuccess

    SendFailed --> SubmitFailed: Return 500
    SubmitFailed --> [*]

    SendSuccess --> CleanupQuote: Delete quote from Redis

    CleanupQuote --> RecordBurn: Add to pending burns

    RecordBurn --> SuccessResponse: Return signature

    SuccessResponse --> [*]
```

### Security Checks
- **Replay Protection**: Atomic hash-based (SET NX in Redis)
- **CPI Protection**: Simulation with balance check (max 2.5M lamports)
- **Blockhash Validation**: Fresh validation via RPC

---

## 3. Burn Flow (Fee Collection → $ASDF Burn)

```mermaid
stateDiagram-v2
    [*] --> BurnWorkerInit: Start interval (60s)

    BurnWorkerInit --> BurnCycle: Periodic check

    BurnCycle --> FeePayerRefillCheck: Check SOL balance

    FeePayerRefillCheck --> RefillNeeded: Balance < buffer
    FeePayerRefillCheck --> RefillNotNeeded: Balance healthy

    RefillNeeded --> VelocityCalc: txPerHour * costPerTx * 2hrs

    VelocityCalc --> GetTreasuryAsdf: Query treasury $ASDF

    GetTreasuryAsdf --> AsdfFound: Balance > 0
    GetTreasuryAsdf --> AsdfNotFound: No $ASDF

    AsdfNotFound --> RefillSkipped: Insufficient treasury

    AsdfFound --> SwapAsdfToSol: Jupiter swap ASDF -> SOL

    SwapAsdfToSol --> SwapJito: Try Jito bundle

    SwapJito --> JitoSuccess: Bundle accepted
    SwapJito --> JitoTimeout: Bundle failed

    JitoSuccess --> RefillComplete
    JitoTimeout --> SwapRPC: Fallback to RPC
    SwapRPC --> RefillComplete

    RefillNotNeeded --> RefillComplete
    RefillSkipped --> RefillComplete

    RefillComplete --> GetTokenBalances: Scan treasury ATAs

    GetTokenBalances --> TokensFound: Tokens >= $0.50
    GetTokenBalances --> NoTokens: Empty treasury

    NoTokens --> BurnCycleEnd
    BurnCycleEnd --> BurnCycle

    TokensFound --> AcquireLock: Redis mutex

    AcquireLock --> LockAcquired: Lock owned
    AcquireLock --> LockHeld: Already processing

    LockHeld --> BurnCycleEnd

    LockAcquired --> ProcessTokenLoop: For each token

    ProcessTokenLoop --> TokenIsAsdf: Is mint = ASDF?

    TokenIsAsdf --> AsdfBranch: 100% burn (purist)
    TokenIsAsdf --> OtherBranch: Swap -> ASDF -> split

    AsdfBranch --> QueueAsdfBurn: Queue full amount
    QueueAsdfBurn --> NextToken

    OtherBranch --> GetEcosystemBonus: Query HolDex burn %

    GetEcosystemBonus --> CalcEcosystemAmount: Direct token burn

    CalcEcosystemAmount --> SwapOtherToAsdf: Remaining -> ASDF

    SwapOtherToAsdf --> SplitBurn: 76.4% burn / 23.6% treasury

    SplitBurn --> NextToken

    NextToken --> ProcessTokenLoop

    ProcessTokenLoop --> PendingBurnsReady: All tokens queued

    PendingBurnsReady --> BatchExecute: Execute batched burns

    BatchExecute --> BatchSuccess: Single TX
    BatchExecute --> BatchFail: TX failed

    BatchFail --> IndividualFallback: Burn individually
    IndividualFallback --> UpdateStats

    BatchSuccess --> UpdateStats

    UpdateStats --> RecordProof: Store burn proof

    RecordProof --> HarmonyNotify: Webhook to HolDex

    HarmonyNotify --> ReleaseLock: Release burn lock

    ReleaseLock --> BurnCycleEnd
```

### Burn Model
| Payment Token | Flow |
|---------------|------|
| **$ASDF** | 100% burn (purist) |
| **Other** | Swap → $ASDF → 76.4% burn / 23.6% treasury |

### External Dependencies
- **Redis**: Distributed lock, velocity tracking
- **Jupiter**: Token swaps
- **Jito**: MEV-protected execution
- **HolDex**: Ecosystem burn bonus
