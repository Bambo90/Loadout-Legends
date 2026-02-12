// update_worklog.js
// Appends a timestamped entry to WORKLOG.md.

const fs = require('fs');
const path = require('path');

function pad2(value) {
    return String(value).padStart(2, '0');
}

function getTimestamp() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = pad2(now.getMonth() + 1);
    const dd = pad2(now.getDate());
    const hh = pad2(now.getHours());
    const min = pad2(now.getMinutes());
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function main() {
    const args = process.argv.slice(2);
    const message = args.find(arg => !arg.startsWith('--')) || 'Auto: worklog update';

    const worklogPath = path.join(process.cwd(), 'WORKLOG.md');
    const line = `- ${getTimestamp()} - ${message}`;

    let existing = '';
    if (fs.existsSync(worklogPath)) {
        existing = fs.readFileSync(worklogPath, 'utf8');
    }

    const needsNewline = existing.length > 0 && !existing.endsWith('\n');
    const updated = existing + (needsNewline ? '\n' : '') + line + '\n';

    fs.writeFileSync(worklogPath, updated, 'utf8');
}

main();
