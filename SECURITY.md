# asdf-brain Security Model

> "Don't trust, verify" - Security by design

## Current Security Measures

### Authentication
- API key required for all sensitive endpoints (`x-api-key` header)
- Keys stored in environment variables (never in code)
- Dashboard uses localStorage for key persistence

### Rate Limiting
- 100 requests per minute per IP
- Configurable via `RATE_LIMIT_MAX` env var

### Transport Security
- HTTPS enforced by Render
- Security headers (X-Frame-Options, XSS protection, etc.)
- CORS restrictions (configurable origins)

### Data Protection
- `.private/` directory gitignored
- No secrets in git history
- Production repos cloned on-demand, gitignored

## Security Hardening Roadmap

### Phase 1: Immediate (Do Now)
- [ ] Add audit logging for API access
- [ ] Implement IP whitelist for admin operations
- [ ] Add API key rotation mechanism
- [ ] Sanitize conversation context in knowledge files

### Phase 2: Short-term (1-2 weeks)
- [ ] Add request signing (HMAC)
- [ ] Implement key expiration
- [ ] Add brute-force protection (account lockout)
- [ ] Set up alerts for suspicious activity

### Phase 3: Medium-term (1 month)
- [ ] Encrypt knowledge files at rest
- [ ] Add multi-factor authentication for dashboard
- [ ] Implement role-based access (read-only vs admin)
- [ ] Add data retention policies

### Phase 4: Long-term
- [ ] Zero-knowledge proofs for sensitive queries
- [ ] End-to-end encryption for MCP
- [ ] Hardware security module (HSM) for key management
- [ ] SOC 2 compliance preparation

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `BRAIN_API_KEYS` | Comma-separated valid API keys | Yes (prod) |
| `RATE_LIMIT_MAX` | Max requests per minute per IP | No (default: 60) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | No (default: all) |

## Incident Response

1. **Suspected breach**: Rotate API keys immediately
2. **Rate limit abuse**: Add IP to blocklist
3. **Data exposure**: Audit logs, notify affected parties

## Reporting Security Issues

Contact: [secure channel to be defined]

Do NOT open public GitHub issues for security vulnerabilities.
