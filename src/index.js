const core = require('@actions/core');

const setupCli = require('./setup-cli');
const setupAstGrep = require('./setup-ast-grep');
const runFixSca = require('./run-fix-sca');
const createPr = require('./create-pr');
const postPrComment = require('./post-pr-comment');

async function main() {
  try {
    // Get inputs
    const githubToken = core.getInput('github-token');
    const repository = core.getInput('repository');
    const branch = core.getInput('branch');
    const githubApiUrl = core.getInput('github-api-url');
    const prNumber = core.getInput('pr-number');
    // const vid = core.getInput('vid');
    // const vkey = core.getInput('vkey');
    const fixScaParams = core.getInput('fix-sca-params');

    const workspaceDir = process.env.GITHUB_WORKSPACE;
    const actionPath = `${__dirname}/..`

    core.info('Starting Veracode Fix for SCA action...');

    // // Setup Veracode CLI
    // core.info('Setting up Veracode CLI...');
    // await setupCli(actionPath, vid, vkey, workspaceDir);

    // Setup ast-grep
    core.info('Setting up ast-grep...');
    await setupAstGrep(actionPath);

    // Run Fix for SCA
    core.info('Running Fix for SCA...');
    const fixScaOutput = await runFixSca(workspaceDir, actionPath, fixScaParams);
    
    if (!fixScaOutput.hasChanges) {
      core.info('No changes detected. Skipping PR creation.');
      return;
    }

    // core.setOutput('run-next-step', 'true');

    // Create Pull Request
    core.info('Creating pull request...');
    const prCreateOutput = await createPr(
      workspaceDir,
      repository,
      branch,
      githubToken,
      githubApiUrl
    );

    // core.setOutput('create-pr-run-next-step', 'true');

    // Post PR comment on original PR
    core.info('Posting comment on original PR...');
    await postPrComment(
      workspaceDir,
      repository,
      prNumber,
      githubToken,
      githubApiUrl
    );

    core.info('Veracode Fix for SCA action completed successfully.');
  } catch (error) {
    core.setFailed(error.message);
    process.exit(1);
  }
}

main();
