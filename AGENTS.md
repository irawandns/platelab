# PlateLab contributor instructions

Treat this repository as the source of truth. Read `README.md`, `specs.md`, and
instructions in any relevant subdirectory before proposing or changing code.
Preserve the existing architecture and conventions.

## Required validation before opening a pull request

Run these checks against the final source state intended for the PR:

```sh
npm test
npm run build:pages
npm run format:check
git diff --check
```

- Unit tests, the production build, formatting, and whitespace checks are required.
- Follow the repository lockfile and Node version. Disclose environment overrides
  and their verification limits.
- Changes invalidate affected validation results; rerun the relevant required checks.
- State the tested commit, commands, results, and material limitations in the PR.
  Check required GitHub Actions results for the exact PR head before calling it
  ready to merge. A pending required check is not a passing check.

## Optional browser validation

**E2E tests are optional.** The user's instruction on 13 October 2026 replaces
the previous mandatory E2E-before-PR policy. A failing, unavailable, or unexecuted
browser suite does not prevent opening a PR, merging, or deployment.

Run browser checks when the user requests them or when a focused check would
materially help investigate an interaction:

```sh
npm run build:pages
PLAYWRIGHT_BASE_PATH=/platelab/ npm run test:e2e
```

CI runs browser checks only when manually dispatching the Pages workflow with
**Run browser E2E checks** enabled. The browser job reports its own result;
deployment depends on the required build job.

- Describe browser checks as passed, failed, or not run; do not imply coverage
  from checks that were skipped.
- Preserve meaningful assertions. Do not weaken tests or repeatedly rerun a
  flaky suite until it happens to pass.
- Investigate intermittent failures when working on those failures; they are
  follow-up work rather than a gate for unrelated feature development.

## Lesson from PR #5

PR #5 passed local E2E validation and its pull-request CI run. The main-branch
deployment subsequently failed in the tablet/all-eleven-models scenario because
the physics state remained `settling` after the 15-second assertion deadline.
This is an observed intermittent settlement/timing failure, not evidence that
E2E testing was omitted. Investigate render speed, simulation progress, and
input/settlement timing before deciding whether the application or test needs a
change. Preserve meaningful settlement assertions and distinguish pre-merge CI
success from the result of the merged deployment.

Evidence:

- Passing PR run: https://github.com/irawandns/platelab/actions/runs/38344397113
- Failing merged run: https://github.com/irawandns/platelab/actions/runs/38364907606
