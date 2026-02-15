#!/bin/bash

# scripts/daily-compound-review.sh
# Runs at 10:30 PM to review day's work and extract learnings
# Updates AGENTS.md with patterns and gotchas

set -e

export PATH="$HOME/.bun/bin:$HOME/.local/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"

PROJECT_DIR="$HOME/projects/capgemini-proposal-generator"
LOG_FILE="$PROJECT_DIR/logs/compound-review-$(date +%Y%m%d).log"

echo "=== Compound Review Started: $(date) ===" | tee -a "$LOG_FILE"

cd "$PROJECT_DIR"

# Ensure we're on main and up to date
git fetch origin main 2>&1 | tee -a "$LOG_FILE"
git checkout main 2>&1 | tee -a "$LOG_FILE"
git pull origin main 2>&1 | tee -a "$LOG_FILE"

# Run compound review via Claude Code
# This extracts learnings from recent work and updates AGENTS.md
claude -p "Load the compound-engineering skill if available. Review git commits and changes from the last 24 hours in this repository. Extract key learnings, patterns discovered, and gotchas encountered. Update the AGENTS.md file's 'Gotchas & Learnings' section with today's date and findings. If no significant learnings, note that briefly. Commit your changes with message 'chore: compound review $(date +%Y-%m-%d)' and push to main." --dangerously-skip-permissions 2>&1 | tee -a "$LOG_FILE"

echo "=== Compound Review Completed: $(date) ===" | tee -a "$LOG_FILE"
