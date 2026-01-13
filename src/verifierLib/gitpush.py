import subprocess
import os
from datetime import datetime

# Change this to the path where your git repo is
GIT_REPO_PATH = "../../"  # or the full path to your project directory

# List of files to commit
FILES_TO_COMMIT = [
    "public/sha_lookup.json"
]

# Commit message
timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
commit_message = f"Update sha_lookup.json at {timestamp}"

def run_git_command(command, cwd=GIT_REPO_PATH):
    result = subprocess.run(command, cwd=cwd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"[ERROR] Command failed: {command}\n{result.stderr}")
    else:
        print(f"[OK] {command}\n{result.stdout.strip()}")

# Step 1: Git add
for file in FILES_TO_COMMIT:
    run_git_command(f"git add {file}")

# Step 2: Git commit
run_git_command(f'git commit -m "{commit_message}"')

# Step 3: Git push
run_git_command("git push")
