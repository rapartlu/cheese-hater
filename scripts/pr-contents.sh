#!/usr/bin/env bash
# pr-contents.sh — emit full contents of all files changed in a branch vs main
#
# Usage:
#   ./scripts/pr-contents.sh                        # diff current branch vs main
#   ./scripts/pr-contents.sh <branch>               # diff <branch> vs main
#   ./scripts/pr-contents.sh <branch> <base>        # diff <branch> vs <base>
#
# Problem this solves:
#   The orchestrator PR reviewer uses `gh pr diff` which truncates large diffs,
#   causing reviewers to flag missing files that are actually present on the
#   branch. This script outputs every changed file's full contents so reviews
#   can proceed without relying on the diff delivery mechanism.
#
# Output format:
#   === FILE: src/routes/facts.ts (65 lines) ===
#   <full file contents>
#   === END: src/routes/facts.ts ===
#
# Exclusions:
#   package-lock.json and yarn.lock are excluded — they are never meaningfully
#   reviewable and are the primary cause of diff truncation (1700+ lines each).

set -euo pipefail

BRANCH="${1:-$(git rev-parse --abbrev-ref HEAD)}"
BASE="${2:-main}"

# Validate
if ! git rev-parse --verify "origin/$BASE" &>/dev/null && ! git rev-parse --verify "$BASE" &>/dev/null; then
  echo "Error: base branch '$BASE' not found" >&2
  exit 1
fi

BASE_REF="$(git rev-parse "origin/$BASE" 2>/dev/null || git rev-parse "$BASE")"
BRANCH_REF="$(git rev-parse "origin/$BRANCH" 2>/dev/null || git rev-parse "$BRANCH")"

CHANGED_FILES=$(git diff --name-only "$BASE_REF".."$BRANCH_REF" 2>/dev/null || \
                git diff --name-only "$BASE".."$BRANCH")

EXCLUDED="package-lock.json yarn.lock pnpm-lock.yaml"

echo "=== PR CONTENTS: $BRANCH vs $BASE ==="
echo "=== Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
echo ""

TOTAL=0
SKIPPED=0

while IFS= read -r file; do
  [[ -z "$file" ]] && continue

  # Skip lockfiles
  basename_file=$(basename "$file")
  if echo "$EXCLUDED" | grep -qw "$basename_file"; then
    echo "--- SKIPPED (lockfile): $file ---"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  # Check file exists on branch (may have been deleted)
  if ! git show "$BRANCH_REF:$file" &>/dev/null 2>&1; then
    echo "--- DELETED in this PR: $file ---"
    echo ""
    continue
  fi

  LINES=$(git show "$BRANCH_REF:$file" | wc -l)
  echo "=== FILE: $file ($LINES lines) ==="
  git show "$BRANCH_REF:$file"
  echo ""
  echo "=== END: $file ==="
  echo ""
  TOTAL=$((TOTAL + 1))
done <<< "$CHANGED_FILES"

FILE_COUNT=$(echo "$CHANGED_FILES" | grep -c . || true)
echo "=== SUMMARY: $TOTAL files shown, $SKIPPED lockfiles excluded, $FILE_COUNT total changed ==="
