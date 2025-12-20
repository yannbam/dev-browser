# dev-browser Project Memory

## Runtime Compatibility (2025-12-20)

**Key finding:** dev-browser does NOT require Bun - it works with Node.js + npm.

### Why this matters
- Bun fails with "illegal instruction" on some CPUs (notably janbam's machine)
- The codebase uses only standard Node.js APIs (express, playwright, fs, path)
- No Bun-specific APIs like `Bun.file()`, `Bun.serve()`, or `bun:*` imports

### Changes made on `no-bun` branch
1. **server.sh** - Auto-detects bun vs npm:
   - Tests `bun --version` to see if bun actually works
   - Falls back to `npm install` + `npx tsx` if bun fails
   
2. **SKILL.md** - Updated all examples to use `npx tsx` as primary

3. **package-lock.json** - Added for npm compatibility

### How to use without Bun
```bash
cd skills/dev-browser
npm install
npx tsx scripts/start-server.ts
```

Or just run `./server.sh` - it auto-detects.

### Node.js requirements
- Node 18+ required (uses global `fetch` API)
- Playwright browsers install automatically on first run

### Verified working
- ✅ npm install (202 packages)
- ✅ npx tsx scripts/start-server.ts  
- ✅ API endpoints (GET /, GET /pages, POST /pages)
- ✅ npx tsc --noEmit (type check)
- ✅ npx vitest run (9 tests pass)
