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
5. Extract only merge commits.
6. For each merge commit:
    * Extract the PR number.
    * Open the GitHub PR.
    * Read the PR title.
    * Read the PR description when needed.
    * Read linked commits only if the PR metadata is not enough.
7. Convert each relevant PR into a changelog entry.
8. Group or order entries by impact, not necessarily by merge order.
9. Always append a Full Changelog GitHub compare link.

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

## GitHub PR lookup

Always link to the merge PR:

```
https://github.com/<owner>/<repo>/pull/<pr-number>
```

If merge commit metadata is unclear, pull the PR description from GitHub.

Use GitHub CLI when available:

```
gh pr view <pr-number> --json title,body,labels,mergedAt,author,url,commits,files
```

If GitHub CLI is not available, use the GitHub web/API access available in the environment.

Do not invent PR details. If the PR cannot be inspected, write a conservative changelog entry based only on known commit metadata.

## Output format

```markdown
Changelog:

* Added: ...
* 📣 Added: ...
  * ...
* Changed: ...
* Fixed: ...

**Full Changelog**: https://github.com/<owner>/<repo>/compare/<previous-tag>...<new-tag>
```

Allowed top-level categories:

* Added
* Changed
* Fixed

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

Do not add 📣 to small refactors, tests, CI-only changes, dependency bumps, copy tweaks, or minor visual fixes unless they clearly matter to users.

## Entry writing rules

Each top-level bullet must:

* include a clear human-readable title
* include the GitHub PR link
* describe user impact when possible
* avoid raw commit-message noise
* avoid overly technical implementation details unless relevant to developers or release reviewers

Good:

```markdown
* 📣 Added: dApp verification banners to signing screens https://github.com/AmbireTech/ambire-app/pull/7052
  * Shows verification status on SignMessage and SignAccountOp screens.
  * Requires Hold to Proceed when risk-related banners are present.
```

Bad:

```markdown
* Added hasUnverifiedDappsAndSendResToUi refactor
```

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

## Final checklist

Before returning the changelog, verify:

* only merge commits were used
* every top-level entry links to a GitHub PR
* marketing-worthy entries have 📣
* public wording is clear
* noisy internal changes are excluded or minimized
* security/signing claims are accurate
* Full Changelog compare link is present
* comparison defaults to main unless the user requested otherwise
