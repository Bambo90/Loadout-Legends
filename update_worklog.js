const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const worklogPath = path.join(__dirname, 'WORKLOG.md');
const raw = process.argv.slice(2).join(' ').trim();
const message = raw || 'AI automated update';
const now = new Date();
const ts = now.toISOString().replace('T', ' ').split('.')[0];

const entry = `### ${ts} (AI)\n- **Message**: ${message}\n- **Commit**: Worklog update by helper script\n\n`;

try {
  fs.appendFileSync(worklogPath, entry, 'utf8');
  console.log('WORKLOG.md updated.');
  try {
    execSync('git add WORKLOG.md', { stdio: 'ignore' });
    execSync(`git commit -m "Worklog: ${message.replace(/"/g, "'")}"`, { stdio: 'ignore' });
    console.log('Committed WORKLOG.md locally. Use `git push` to push the commit.');
  } catch (err) {
    console.log('Could not commit automatically (no git repo or no changes).');
  }
} catch (err) {
  console.error('Failed to update WORKLOG.md:', err.message);
  process.exit(1);
}
