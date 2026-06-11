# AI Radar - Maintenance & Quality Guide

> Reference: luban craftsmanship methodology
> "活体检查" (living body check) + "宁缺毋滥" (rather lack than滥)

## Quality Tools

Run these tools regularly to maintain data quality:

```bash
# Data quality check (run daily)
node tools/quality-check.js --verbose

# Scoring backtest (run after any scoring change)
node tools/backtest-scoring.js --days=14 --threshold=5

# Deduplication check (run weekly)
node tools/dedup-check.js --max-source-ratio=0.3
```

## Quality Gates

### Before Deploying Scoring Changes

1. **Freeze baseline**: Record current score distribution
2. **Run backtest**: `node tools/backtest-scoring.js --days=14`
3. **Check regressions**: Any product score drop > 5 points needs review
4. **Verify with real data**: Don't trust CI green lights — pull production data
5. **Get explicit approval**: Changes must be approved in imperative sentences

### Before Adding New Data Sources

1. **Source diversity check**: New source should not exceed 30% of total products
2. **Deduplication test**: Run dedup-check after adding source
3. **Quality threshold**: New source products must pass score ≥ 30
4. **Backtest**: Run 7-day backtest to verify no regressions

### Before Schema Changes

1. **Migration script**: Create numbered migration in `supabase/migrations/`
2. **Rollback plan**: Document how to revert if needed
3. **Seed data update**: Update seed files if schema changes affect them
4. **Test with production data**: Run quality-check after migration

## Monitoring Checklist

### Daily (Automated)
- [ ] Crawler runs successfully (GitHub Actions)
- [ ] No 500 errors in Vercel logs
- [ ] API response time < 500ms

### Weekly (Manual)
- [ ] Run `node tools/quality-check.js`
- [ ] Run `node tools/dedup-check.js`
- [ ] Check Vercel analytics for error rates
- [ ] Review new products added this week

### After Any Code Change
- [ ] `npm run build` succeeds
- [ ] `node tools/backtest-scoring.js` passes
- [ ] No new console errors in production

## Scoring Algorithm

Current scoring rules (as of 2026-06-11):

| Signal | Points | Condition |
|--------|--------|-----------|
| Base | 20 | Every product |
| Multi-source (2+) | +30 | Mentioned by 2+ sources |
| Multi-source (3+) | +35 | Mentioned by 3+ sources |
| GitHub stars (100+) | +15 | Has 100+ GitHub stars |
| GitHub stars (1k+) | +20 | Has 1,000+ GitHub stars |
| GitHub stars (10k+) | +25 | Has 10,000+ GitHub stars |
| Website exists | +10 | Has official website URL |
| Recent activity | +20 | Updated within 30 days |
| Dominant source decay | -10 | Source exceeds 30% ratio |
| Quality threshold | min 30 | Products below 30 are filtered |

**Maximum score**: 100

## Source Dominance Prevention

If a single source contributes > 30% of products:
1. Products from that source get -10 point decay
2. Investigate why the source is dominant
3. Consider adding more diverse sources
4. Review deduplication logic for that source

## Data Freshness

Products should be re-validated every 24 hours:
- Active products: Re-crawl and update scores
- Stale products (no update in 30 days): Lower confidence
- Dead products (no update in 90 days): Mark as `inactive`

## Incident Response

### If Crawler Fails
1. Check GitHub Actions logs
2. Verify API keys are valid
3. Run crawler manually: `cd crawler && npm start`
4. Check Supabase connection

### If Scores Drop Suddenly
1. Run `node tools/backtest-scoring.js`
2. Check for scoring algorithm changes
3. Verify source data quality
4. Roll back scoring changes if needed

### If Duplicate Products Appear
1. Run `node tools/dedup-check.js`
2. Check slug uniqueness in database
3. Review dedup pipeline logic
4. Manually merge duplicates if needed

## Iteration Discipline

Reference: luban "慢刨" (slow-plane) pattern

1. **One change per round**: Don't mix scoring changes with UI changes
2. **Freeze baseline**: Record current state before changes
3. **Validation gate**: Every change must pass backtest
4. **Commit immediately**: Don't accumulate uncommitted changes
5. **Deploy separately**: Each change gets its own deployment

## Tools Reference

| Tool | Purpose | Frequency |
|------|---------|-----------|
| `quality-check.js` | Validate data integrity | Daily |
| `backtest-scoring.js` | Verify scoring consistency | After changes |
| `dedup-check.js` | Detect duplicates | Weekly |
