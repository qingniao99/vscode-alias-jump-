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

// 1. Get current version
const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentVersion = packageJson.version;
const tagName = `v${currentVersion}`;

// Check if tag already exists (resume mode)
let isResume = false;
try {
    execSync(`git rev-parse ${tagName}`, { stdio: 'ignore' });
    isResume = true;
    console.log(`Tag ${tagName} already exists. Resuming release...`);
} catch (e) {
    // Tag does not exist, proceed with normal flow
}

if (!isResume) {
    // 1. Bump version (patch) without git tag/commit
    console.log('Step 1: Bumping version...');
    run('npm version patch --no-git-tag-version');

    // Reload version after bump
    const updatedPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const newVersion = updatedPackageJson.version;
    const newTagName = `v${newVersion}`;
    
    console.log(`New version: ${newVersion}`);

    // 2. Git add
    console.log('Step 2: Staging changes...');
    run('git add .');

    // 3. Git commit
    console.log('Step 3: Committing...');
    run(`git commit -m "chore: release ${newTagName}"`);

    // 4. Git tag
    console.log('Step 4: Tagging...');
    run(`git tag ${newTagName}`);
} else {
    console.log(`Skipping version bump and commit because tag ${tagName} exists.`);
}

// 5. Git push
console.log('Step 5: Pushing to remote...');
run('git push --follow-tags');

// 6. Package
console.log('Step 6: Packaging...');
run('npm run package');

// 7. Publish
console.log('Step 7: Publishing...');
run('npm run publish');

console.log('Release completed successfully!');
