#!/usr/bin/env bash
# Publish every pending "linkedin-publish" issue (or the one issue in EVENT_ISSUE),
# record each post on the site and report on the issue. Runs inside GitHub Actions:
# needs gh (GH_TOKEN), git configured to push to main, and the LINKEDIN_* secrets.
# STRICT=true makes the run fail when a post fails (used for issue events, so the
# failure is visible); the hourly retry stays quiet and simply tries again.
set -u
owner=${GITHUB_REPOSITORY%%/*}
if [ -n "${EVENT_ISSUE:-}" ]; then
  issues=$EVENT_ISSUE
else
  issues=$(gh issue list --repo "$GITHUB_REPOSITORY" --label linkedin-publish --state open --author "$owner" --json number --jq '.[].number')
fi
[ -z "$issues" ] && { echo "Nothing pending."; exit 0; }

failed=0
for n in $issues; do
  echo "== issue #$n"
  gh api "repos/$GITHUB_REPOSITORY/issues/$n" --jq '{issue: .}' > event-issue.json || { failed=1; continue; }
  if [ "$(jq -r '.issue.user.login' event-issue.json)" != "$owner" ]; then
    echo "Not opened by the repository owner; skipped."; continue
  fi
  bot_comments=$(gh api "repos/$GITHUB_REPOSITORY/issues/$n/comments" --paginate --jq '.[] | select(.user.login == "github-actions[bot]") | .body')
  if grep -q '^Published on LinkedIn: ' <<< "$bot_comments"; then
    echo "This issue was already published; nothing to do." | gh issue comment "$n" --repo "$GITHUB_REPOSITORY" --body-file -
    gh issue close "$n" --repo "$GITHUB_REPOSITORY"
    continue
  fi
  rm -f error.txt post-url.txt test-report.txt
  git pull -q --rebase origin main
  if [ "${LINKEDIN_DRY_RUN:-}" = "1" ]; then
    # Test mode (data/linkedin-mode.txt says "test"): validate and check the token, post nothing, keep the issue open.
    if python scripts/linkedin_publish.py event-issue.json; then
      report=$(cat test-report.txt)
    else
      failed=1
      report=$(cat error.txt 2>/dev/null || echo "The check stopped before validating.")
    fi
    { echo "Test only, nothing was posted:"; echo; echo "$report"; echo; echo "Change data/linkedin-mode.txt to \"live\" to publish for real."; } > comment.txt
    if ! grep -qF -- "$report" <<< "$bot_comments"; then
      gh issue comment "$n" --repo "$GITHUB_REPOSITORY" --body-file comment.txt
    else
      echo "Same test result as last time; not repeating the comment."
    fi
    continue
  fi
  if python scripts/linkedin_publish.py event-issue.json; then
    # Posted. Whatever happens to the build now, the post is recorded so it is never posted twice.
    url=$(cat post-url.txt)
    cp data/linkedin-posts.json "$RUNNER_TEMP/linkedin-posts.json"
    note="It appears on https://adeebnoor.github.io/ within a few minutes."
    if ! (python scripts/build_site.py && python scripts/validate_site.py); then
      git checkout -q -- .
      cp "$RUNNER_TEMP/linkedin-posts.json" data/linkedin-posts.json
      note="The site build failed after posting; the post is recorded and appears after the next successful build."
    fi
    git add -A
    git reset -q -- error.txt post-url.txt event-issue.json comment.txt 2>/dev/null || true
    if ! git diff --cached --quiet; then
      git commit -q -m "site: show LinkedIn post (#$n)"
      git push -q origin HEAD:main
    fi
    { echo "Published on LinkedIn: $url"; echo; echo "$note"; } > comment.txt
    gh issue comment "$n" --repo "$GITHUB_REPOSITORY" --body-file comment.txt
    gh issue close "$n" --repo "$GITHUB_REPOSITORY"
  else
    failed=1
    git checkout -q -- . 2>/dev/null || true
    reason=$(cat error.txt 2>/dev/null || echo "The workflow stopped before posting.")
    { echo "Not published:"; echo; echo "$reason"; echo; echo "Nothing was posted to LinkedIn. Fix the cause; the site retries this issue every hour (or close and reopen it to retry now)."; } > comment.txt
    last=$(tail -n 12 <<< "$bot_comments" | tr -d '\r')
    if ! grep -qF -- "$reason" <<< "$last"; then
      gh issue comment "$n" --repo "$GITHUB_REPOSITORY" --body-file comment.txt
    else
      echo "Same failure as last time; not repeating the comment: $reason"
    fi
  fi
done
rm -f event-issue.json comment.txt error.txt post-url.txt test-report.txt
if [ "$failed" = 1 ] && [ "${STRICT:-false}" = "true" ]; then exit 1; fi
exit 0
