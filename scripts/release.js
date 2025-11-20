const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(command) {
    console.log(`Running: ${command}`);
    try {
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        console.error(`Command failed: ${command}`);
        process.exit(1);
    }
}

// 1. Bump version (patch) without git tag/commit
console.log('Step 1: Bumping version...');
run('npm version patch --no-git-tag-version');

// 2. Read new version
const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;
console.log(`New version: ${version}`);

// 3. Git add
console.log('Step 2: Staging changes...');
run('git add .');

// 4. Git commit
console.log('Step 3: Committing...');
run(`git commit -m "chore: release v${version}"`);

// 5. Git tag
console.log('Step 4: Tagging...');
run(`git tag v${version}`);

// 6. Git push
console.log('Step 5: Pushing to remote...');
run('git push --follow-tags');

// 7. Package
console.log('Step 6: Packaging...');
run('npm run package');

// 8. Publish
console.log('Step 7: Publishing...');
run('npm run publish');

console.log('Release completed successfully!');
