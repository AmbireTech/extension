---
name: changelogger
description: >
  Generates public GitHub release changelogs from merge commits. Compares the release branch/tag
  against main by default, extracts merged PRs, links every entry to its GitHub PR, pulls PR details
  when merge metadata is unclear, marks marketing-worthy changes with 📣, and always appends a Full
  Changelog compare link.
---

# Changelogger

Generate a public GitHub Release changelog from git history.
Use this skill when the user asks to create, update, or review a changelog for a release.

Default assumption:

* The changelog is for a public GitHub Release.
* The comparison target is `main` unless comparison tag is specified.
* Only merge commits should be considered.
* Every changelog entry must link to the merged GitHub PR.
* The output should be useful for users, QA, support, and marketing.


## Inputs

When possible, infer:
* repository owner/name from the current git remote
* release version from the branch, tag, or user request
* previous release tag from GitHub releases or git tags
* target branch as `main` unless the user says otherwise

If the user provides a release branch, compare it against `main` by default.

Examples:

```bash
git log --merges --oneline main..release/v6.8.0
```

or, when generating the final GitHub compare link:

```
https://github.com/<owner>/<repo>/compare/<previous-tag>...<new-tag>
```

Workflow

1. Identify the repository.
2. Identify the release branch or release tag.
3. Identify the previous release tag.
4. Compare the release against main by default, unless the user gives another base.
5. Extract all merge commits from the log.
6. Filter out branch-sync merge commits (see "Which merge commits to skip" below). Keep every commit that contains a PR number.
7. Extract all PR numbers from the surviving commits.
8. **Bulk-fetch all PR metadata in one pass** using the GitHub CLI before writing any entries (see "Bulk PR fetch" below). Do not fetch PRs one-by-one lazily.
9. Cross-check the fetched PR list against the merge commit list to confirm no PRs were missed.
10. Apply the exclusion rules (see "Excluded product areas" below) to drop Rewards/Legends PRs. Every other PR is included.
11. Convert each remaining PR into a changelog entry.
12. Categorize each remaining PR as Added, Changed, or Fixed.
13. Preserve the original merge-commit timeline within each category.
14. Always append a Full Changelog GitHub compare link.

## ambire-common submodule bump (root repo changelogs only)

When generating a changelog for the root `ambire-app` repository, check whether the `src/ambire-common` submodule was updated in this release:

```bash
git diff main...<release-branch> -- src/ambire-common
```

If the submodule pointer changed, find the tag it now points to:

```bash
cd src/ambire-common && git describe --tags --exact-match HEAD
```

If there is an exact tag, **always insert this as the very first entry** in the changelog (before all other Added entries), substituting the real version number:

```markdown
* Added: Migrate to **ambire-common [v2.100.0](https://github.com/AmbireTech/ambire-common/releases/tag/v2.100.0), see changelog in there too**.
```

Assume a release tag exists for that version even if it has not been published yet — just substitute the numbers. Do not add 📣 to this entry.

## Git commands

Prefer merge commits only:

```bash
git log --merges --first-parent --pretty=format:"%H %s" main..<release-branch-or-tag>
```

If comparing two tags:

```
git log --merges --first-parent --pretty=format:"%H %s" <previous-tag>..<new-tag>
```

To inspect one merge commit:

```bash
git show --stat --summary <merge-commit-sha>
```

To extract PR numbers from merge commit titles, support common formats:

```
Merge pull request #1234 from ...
Merge branch 'feature' into ...
PR #1234
(#1234)
```

If the PR number is missing or unclear, inspect the commit body and GitHub history.

## Which merge commits to skip

Skip a merge commit if its subject line matches any of these patterns — they are branch-sync commits, not PR merges:

```
Merge branch 'main' into ...
Merge branch 'main' of ...
Merge branch 'release/...' into ...
Merge branch 'release/...' of ...
Merge branch 'v2' ...        (or any integration/trunk branch name)
```

Keep every merge commit that contains a PR number in any supported format:

```
Merge pull request #1234 from ...
(#1234)
PR #1234
```

**Do not skip a PR merge just because the branch name looks internal** (e.g. `fix/`, `docs/`, `config/`, `qa/`). The only skip rule is Rewards/Legends (see "Excluded product areas"). Everything else appears in the changelog.

## Excluded product areas

This changelog covers the **Ambire wallet** (extension + mobile app) and the Benzin transaction viewer. It does NOT cover the standalone Rewards website (`src/legends/`).

**Only one reason to exclude a PR entirely:**

* its branch name starts with `rewards`, `rewards-hold`, `rewards/`, or `legends/`; **or**
* its changed files are exclusively inside `src/legends/` (check via `gh pr view <n> --json files`)

**Everything else is included** — CI fixes, QA test selectors, AGENTS.md docs, config changes, TypeScript error fixes, internal refactors. These are still part of the release and belong in the changelog. List them briefly (one line, no 📣) rather than omitting them.

## Bulk PR fetch

After extracting all PR numbers, fetch their metadata in a single parallel pass before writing any entries:

```bash
# Run for each PR number — parallelize with & or use xargs
gh pr view <pr-number> --json number,title,body,labels,url,files
```

Alternatively use a loop:

```bash
for n in 1234 1235 1236; do
  gh pr view $n --json number,title,body,labels,url &
done
wait
```

Once all metadata is fetched, cross-check the set of PR numbers against the merge commit list. If a PR appears in the commit log but was not returned by the bulk fetch, investigate before omitting it.

## GitHub PR lookup

Always link to the merge PR:

```
https://github.com/<owner>/<repo>/pull/<pr-number>
```

If GitHub CLI is not available, use the GitHub web/API access available in the environment.

Do not invent PR details. If the PR cannot be inspected, write a conservative changelog entry based only on known commit metadata.

## Output format

Wrap the entire changelog in a fenced `markdown` code block so the UI renders a copy button:

````
```markdown
Changelog:

* Added: ...
* 📣 Added: ...
  * ...
* Changed: ...
* Fixed: ...

**Full Changelog**: https://github.com/<owner>/<repo>/compare/<previous-tag>...<new-tag>
```
````

Start the changelog with exactly: "Changelog:"

Keep all entries in one flat bullet list. Group entries in this order: Added, Changed, Fixed.

Within each category group, preserve the original merge-commit order.

Do not add category headings or visual separators between groups.

## Marketing-worthy changes

Prefix with 📣 when the change is worth marketing, announcement, release highlights, social post, newsletter, or sales/support visibility.

Examples of marketing-worthy changes:

* major new user-facing feature
* security feature
* hardware wallet support
* new chain support
* new dApp/signing protection
* major UX improvement
* major Swap & Bridge capability
* account recovery, onboarding, or signing flow improvement
* performance improvement users can feel
* reliability improvement that fixes a visible pain point

Example:

```markdown
* 📣 Added: Address poisoning detection for the recipient on the Send screen https://github.com/AmbireTech/ambire-app/pull/7029
  * Highlights suspicious recipient addresses when they closely resemble a previously used trusted address.
  * Requires Hold to Proceed when a possible poisoning attempt is detected.
```

Do not add 📣 to small refactors, tests, CI-only changes, dependency bumps, copy tweaks, internal docs/config, or minor visual fixes.

## Product name normalization

Always use the current public product names in changelog entries, regardless of what appears in branch names, commit messages, or PR titles:

| Legacy name (used internally) | Public name to use in changelog |
|-------------------------------|----------------------------------|
| Benzin                        | Ambire Explorer                  |
| Legends                       | Ambire Rewards                   |

Apply this silently — do not mention the rename in the entry.

## Entry writing rules

Each top-level bullet must:

* include a clear human-readable title
* include the GitHub PR link
* describe user impact when possible
* avoid raw commit-message noise
* avoid overly technical implementation details unless relevant to developers or release reviewers
* never use em dashes (--); use a colon, comma, or rephrase instead

For internal/technical entries (CI fixes, QA test updates, config, docs, TS errors, etc.) — include them but keep it to a single line. Do not add sub-bullets or details.

Good:

```markdown
* 📣 Added: dApp verification banners to signing screens https://github.com/AmbireTech/ambire-app/pull/7052
  * Shows verification status on SignMessage and SignAccountOp screens.
  * Requires Hold to Proceed when risk-related banners are present.
* Changed: QA workflow — separate HTML reports per test group https://github.com/AmbireTech/ambire-app/pull/7119
* Fixed: TypeScript errors from dApp interface changes https://github.com/AmbireTech/ambire-app/pull/7163
```

Bad:

```markdown
* Added hasUnverifiedDappsAndSendResToUi refactor
```

Category rules:

* `Added` - new user-facing features, new supported flows, new integrations, new protections, new screens, new settings, or newly exposed capabilities.
* `Changed` - behavior changes, UX improvements, copy changes, refactors, dependency/config/tooling changes, QA/CI/docs updates, and changes to existing functionality.
* `Fixed` - bug fixes, regressions, broken flows, crashes, incorrect behavior, TypeScript/build errors, test failures, and reliability fixes.

If unclear, use `Changed`.

## Sub-bullets

Use sub-bullets when:

* the PR contains multiple user-visible changes
* the feature needs context
* there are important edge cases
* QA/support need details

Keep sub-bullets concise.

Avoid copying the full PR description unless it is already release-ready.

# Ambiguous PRs

When PR metadata is unclear:

1. Read the PR description.
2. Inspect changed files.
3. Inspect commits inside the PR.
4. Infer the smallest safe user-facing summary.
5. If still unclear, mark it conservatively as Changed.

Never exaggerate.

Never claim a security improvement unless the PR clearly supports it.

## Full Changelog

Always end with:

```markdown
**Full Changelog**: https://github.com/<owner>/<repo>/compare/<previous-tag>...<new-tag>
```

## Skipped PRs

After the fenced changelog block, always append a plain-text section listing every PR that was excluded and why:

```
---
**Excluded (Rewards/Legends):** #7193, #7173, #7171, #7168, #7162, #7158, #7150, #7144
**Excluded (branch-sync commits):** Merge branch 'main' of ..., Merge branch 'release/v6.8' of ...
```

This makes the exclusion decisions transparent and reviewable.

## Final checklist

Before returning the changelog, verify:

* only merge commits were used
* every top-level entry links to a GitHub PR
* marketing-worthy entries have 📣
* public wording is clear
* no em dashes in any entry
* Rewards/Legends PRs are excluded; all other PRs are present (including CI, QA, config, docs, TS fixes)
* skipped PRs and branch-sync commits are listed after the changelog block
* security/signing claims are accurate
* Full Changelog compare link is present
* comparison defaults to main unless the user requested otherwise
