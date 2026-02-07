# Contributing

## Workflow

1. Pick ready work with `bd ready --json`.
2. Claim the issue: `bd update <id> --claim --json`.
3. Implement and validate with:
   - `bun run lint`
   - `bun run test`
   - `bun run build`
4. Close completed issue: `bd close <id> --reason "Completed" --json`.

## Commit Conventions

Use concise, scoped commit subjects:

- `feat: ...` for new functionality
- `fix: ...` for bug fixes
- `chore: ...` for tooling and maintenance
- `docs: ...` for documentation updates
- `refactor: ...` for code restructuring without behavior changes
- `test: ...` for test-only changes

Example:

`feat(api): add session start endpoint contract`
