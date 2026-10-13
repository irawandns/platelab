# PlateLab contributor instructions

Treat this repository as the source of truth. Read `README.md`, `specs.md`, and
instructions in any relevant subdirectory before proposing or changing code.
Preserve the existing architecture and conventions.

## Required validation before opening a pull request

The user requires E2E tests to pass **before creating any PR, including a draft**.
Run validation against the final source state intended for the PR:

```sh
npm test
npm run build:pages
PLAYWRIGHT_BASE_PATH=/platelab/ npm run test:e2e
npm run format:check
git diff --check
```

- The complete E2E suite must pass against the production build at `/platelab/`.
  Unit tests, a successful build, screenshots, and a passing targeted test are
  not substitutes for the full suite.
- Follow the lockfile, Node version, and browser setup used by
  `.github/workflows/pages.yml`. Disclose necessary environment overrides and
  their verification limits; never present them as identical to CI.
- Changes after validation invalidate affected results. Rebuild and rerun the
  complete E2E suite after application, test, build, or deployment-path changes.
- A failing or blocked E2E run prevents PR creation. Investigate the failure and
  fix its cause. Do not hide it by skipping assertions, adding retries, weakening
  checks, or repeatedly rerunning until one result is green.
- When repairing an intermittent E2E failure, reproduce or investigate the
  failure, then require the affected scenario to pass at least three consecutive
  runs and the complete suite to pass before opening the PR.
- State the tested source commit, commands, results, and material limitations in
  the PR. After opening it, check the GitHub Actions result for that exact head
  commit before calling it ready to merge. A pending run is not a passing run.

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
