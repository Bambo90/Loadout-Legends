const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const worklogPath = path.join(__dirname, 'WORKLOG.md');
// parse args; support a --no-commit flag so hooks can append without committing
const args = process.argv.slice(2);
const noCommitIndex = args.indexOf('--no-commit');
const noCommit = noCommitIndex !== -1;
if (noCommit) args.splice(noCommitIndex, 1);
const raw = args.join(' ').trim();
const message = raw || 'AI automated update';
const now = new Date();
const ts = now.toISOString().replace('T', ' ').split('.')[0];

const entry = `### ${ts} (AI)\n- **Message**: ${message}\n- **Commit**: Worklog update by helper script\n\n`;

try {
  fs.appendFileSync(worklogPath, entry, 'utf8');
  console.log('WORKLOG.md updated.');
  if (!noCommit) {
    try {
      execSync('git add WORKLOG.md', { stdio: 'ignore' });
      execSync(`git commit -m "Worklog: ${message.replace(/"/g, "'")}"`, { stdio: 'ignore' });
      console.log('Committed WORKLOG.md locally. Use `git push` to push the commit.');
    } catch (err) {
      console.log('Could not commit automatically (no git repo or no changes).');
    }
  } else {
    console.log('Appended WORKLOG.md (no commit as requested).');
  }
} catch (err) {
  console.error('Failed to update WORKLOG.md:', err.message);
  process.exit(1);
}
