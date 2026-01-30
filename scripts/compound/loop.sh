#!/bin/bash

# scripts/compound/loop.sh
# Iterative implementation loop - runs Claude Code to work on tasks
# Usage: ./loop.sh [max_iterations]

set -e

PROJECT_DIR="$HOME/projects/capgemini-proposal-generator"
MAX_ITERATIONS=${1:-10}
ITERATION=0

cd "$PROJECT_DIR"

echo "Starting implementation loop (max $MAX_ITERATIONS iterations)..."

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
    ITERATION=$((ITERATION + 1))
    echo ""
    echo "=== Iteration $ITERATION of $MAX_ITERATIONS ==="

    # Run Claude Code to work on the current priority
    # It will read AGENTS.md for context and reports/priorities.md for tasks
    RESULT=$(claude -p "You are working on ProposalAI. Read AGENTS.md for project context and reports/priorities.md for the current priority queue.

Work on the FIRST uncompleted task from Priority 1.
- If a task is marked [ ], it's uncompleted - work on it
- When you complete a task, mark it [x] in reports/priorities.md
- Make small, focused changes
- Commit after each completed task with a descriptive message
- If you encounter a blocker, note it in AGENTS.md under Gotchas

After completing a task or if blocked, respond with either:
- CONTINUE - if there are more tasks to do
- DONE - if all Priority 1 tasks are complete
- BLOCKED - if you can't proceed

Only output CONTINUE, DONE, or BLOCKED as your final word." --dangerously-skip-permissions 2>&1)

    echo "$RESULT"

    # Check the result
    if echo "$RESULT" | grep -q "DONE"; then
        echo "All tasks completed!"
        break
    fi

    if echo "$RESULT" | grep -q "BLOCKED"; then
        echo "Implementation blocked. Check AGENTS.md for details."
        break
    fi

    # Small delay between iterations
    sleep 2
done

echo ""
echo "Loop completed after $ITERATION iterations."
