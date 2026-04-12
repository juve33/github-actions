const fs = require('fs');
const { execSync } = require('child_process');

function extractHeader(content) {
  const match = content.match(/\/\*([\s\S]*?)\*\//);
  return match ? match[1] : '';
}

function parseHeader(header) {
  return Object.fromEntries(
    header
      .split('\n')
      .map(line => line.split(':'))
      .filter(parts => parts.length >= 2)
      .map(([key, ...rest]) => [
        key.trim().toLowerCase(),
        rest.join(':').trim()
      ])
  );
}

function parseTheme(content) {
  const header = extractHeader(content);
  const data = parseHeader(header);

  return {
    version: data['version'] || '',
    requires: data['requires at least'] || '',
    tested: data['tested up to'] || '',
    textDomain: data['text domain'] || '',
  };
}

function setOutput(name, value) {
  require('fs').appendFileSync(
    process.env.GITHUB_OUTPUT,
    `${name}=${value}\n`
  );
  console.log(`${name}=${value}`);
}



// current version
const stylePath = `./style.css`;

if (!fs.existsSync(stylePath)) {
  console.error(`style.css not found at ${stylePath}`);
  process.exit(1);
}

const currentContent = fs.readFileSync(stylePath, 'utf8');
const current = parseTheme(currentContent);

if (!current.version) {
  console.error('No version found in style.css');
  process.exit(1);
}

// previous version
let previous = { version: '' };

try {
  const oldContent = execSync(`git show HEAD~1:${stylePath}`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore']
  });
  previous = parseTheme(oldContent);
} catch (e) {}


console.log(`previous version=${previous.version}`);
const changed = current.version !== previous.version;



setOutput("version", current.version);
setOutput("changed", changed);
setOutput("requires", current.requires);
setOutput("tested", current.tested);
setOutput("text_domain", current.textDomain);