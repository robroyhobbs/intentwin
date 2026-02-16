# IntentWin Robustness Improvement - Master Plan

## Overview

Complete 7-phase improvement plan to make IntentWin production-ready with comprehensive testing, rate limiting, security hardening, API standardization, observability, performance optimization, and code quality improvements.

## Phase Dependencies

```
Phase 1: Testing Infrastructure
    ↓
Phase 2: Rate Limiting
    ↓
Phase 3: Security Audit Completion
    ↓
Phase 4: API Robustness
    ↓
Phase 5: Observability
    ↓
Phase 6: Performance Optimization
    ↓
Phase 7: Code Quality
```

## Phase Summary

| Phase | Focus | Duration | Key Deliverables |
|-------|-------|----------|------------------|
| 1 | Testing Infrastructure | 2 days | E2E tests, 70% coverage, mock utilities |
| 2 | Rate Limiting | 2 days | Redis, rate limits, quotas, CSRF |
| 3 | Security Audit | 2 days | Log sanitization, size limits, CSRF, sanitization |
| 4 | API Robustness | 2 days | Zod validation, error standardization, OpenAPI |
| 5 | Observability | 2 days | Sentry, logging, health checks, alerting |
| 6 | Performance | 2 days | Parallel generation, caching, deduplication |
| 7 | Code Quality | 1 day | Mock consolidation, JSDoc, error boundaries |

**Total: ~13 days of work**

## Execution with TaskSwarm

### Starting Continuous Execution

```bash
# Navigate to project
cd /Users/robroyhobbs/projects/capgemini-proposal-generator

# Run TaskSwarm in continuous mode
/swarm run-all
```

### Monitoring Progress

```bash
# Check task status
/swarm list

# Check specific phase
/swarm check robustness-phase-1

# View logs
tail -f logs/taskswarm/robustness-phase-1.log
```

### Manual Intervention

```bash
# If a task is blocked
/swarm unblock robustness-phase-2 "Redis configured"

# To approve a completed phase
/swarm approve robustness-phase-1

# To reject and send back
/swarm reject robustness-phase-1 "Need more E2E tests"
```

## Success Criteria (All Phases)

- [ ] All E2E tests passing (Phase 1)
- [ ] 70%+ code coverage (Phase 1)
- [ ] Rate limits enforced on all routes (Phase 2)
- [ ] Zero sensitive data in logs (Phase 3)
- [ ] CSRF protection active (Phase 3)
- [ ] All API routes validate inputs (Phase 4)
- [ ] OpenAPI documentation available (Phase 4)
- [ ] Sentry receiving errors (Phase 5)
- [ ] Section generation 40% faster (Phase 6)
- [ ] 80% of functions documented (Phase 7)

## External Dependencies

Before starting, ensure:

1. **Upstash Redis** - Create account at upstash.com (free tier)
2. **Sentry** - Create project at sentry.io (free tier)
3. **Playwright** - Browsers will auto-install on first run

## Environment Variables Needed

Add to `.env.local`:

```bash
# Redis (Phase 2+)
UPSTASH_REDIS_REST_URL=https://your-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# Sentry (Phase 5+)
SENTRY_DSN=https://your-dsn.sentry.io

# Rate Limiting (optional overrides)
RATE_LIMIT_AI_GENERATIONS_PER_DAY=50
RATE_LIMIT_API_REQUESTS_PER_MINUTE=100
```

## File Structure Created

```
.intent/
├── robustness-phase-1/
│   ├── TASK.yaml
│   ├── INTENT.md
│   └── PLAN.md
├── robustness-phase-2/
│   ├── TASK.yaml
│   ├── INTENT.md
│   └── PLAN.md
├── robustness-phase-3/
│   ├── TASK.yaml
│   ├── INTENT.md
│   └── PLAN.md
├── robustness-phase-4/
│   ├── TASK.yaml
│   ├── INTENT.md
│   └── PLAN.md
├── robustness-phase-5/
│   ├── TASK.yaml
│   ├── INTENT.md
│   └── PLAN.md
├── robustness-phase-6/
│   ├── TASK.yaml
│   ├── INTENT.md
│   └── PLAN.md
└── robustness-phase-7/
    ├── TASK.yaml
    ├── INTENT.md
    └── PLAN.md

taskswarm/
└── config.yaml

logs/
└── taskswarm/
    └── (execution logs)
```

## Next Steps

1. **Configure External Services**
   - Sign up for Upstash Redis
   - Sign up for Sentry
   - Add env vars to `.env.local`

2. **Start TaskSwarm**
   ```bash
   /swarm run-all
   ```

3. **Monitor Progress**
   - Check `/swarm list` periodically
   - Review logs in `logs/taskswarm/`
   - Approve phases as they complete

4. **Manual Review Points**
   - After Phase 1: Review test coverage report
   - After Phase 3: Security audit sign-off
   - After Phase 4: API contract review
   - After Phase 7: Final code review

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Phase takes longer than estimated | TaskSwarm will continue until complete; heartbeat prevents indefinite hangs |
| Tests break existing functionality | Each phase has comprehensive tests; block on test failure |
| Redis/Sentry unavailable | Phases 1-4 can run without external deps; phases 5-6 will wait |
| Dependency chain too rigid | Can unblock phases manually if prerequisites met |

## Rollback Plan

If critical issues arise:
1. TaskSwarm commits each phase separately
2. Use `git revert` to rollback specific phase
3. Fix issue and re-run from that phase

## Questions?

Check TaskSwarm documentation:
- `/swarm --help` for command reference
- Check `.agents/skills/swarm/SKILL.md` for detailed docs
