const fs = require('fs');
const path = require('path');
const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');

async function postPrComment(workspaceDir, repository, prNumber, githubToken, githubApiUrl) {
  try {
    const resultsFilePath = path.join(workspaceDir, 'github_fix_pr_post_response.json');

    if (!fs.existsSync(resultsFilePath)) {
      core.warning(`Fix PR response file not found at ${resultsFilePath}. Skipping comment post.`);
      return;
    }

    const prResponse = fs.readFileSync(resultsFilePath, 'utf8');
    core.info('Fix PR Response:');
    core.info(prResponse);

    // Generate the comment body
    // Note: This assumes you have a helper script. If the helper script is not available,
    // we'll create a basic comment body based on the PR response.
    let commentBody = '';
    const helperScriptPath = path.join(
      workspaceDir,
      'veracode-helper/helper/scripts/post-fix-mr-comment.sh'
    );

    if (fs.existsSync(helperScriptPath)) {
      try {
        core.info(`Running helper script: ${helperScriptPath}`);
        await exec.exec('bash', [helperScriptPath, resultsFilePath], {
          listeners: {
            stdout: (data) => {
              commentBody += data.toString();
            }
          }
        });
      } catch (error) {
        core.warning(`Helper script failed: ${error.message}. Using default comment body.`);
        commentBody = generateDefaultCommentBody(prResponse);
      }
    } else {
      core.info('Helper script not found. Using default comment body.');
      commentBody = generateDefaultCommentBody(prResponse);
    }

    if (!commentBody || commentBody.trim().length === 0) {
      core.warning('Comment body is empty. Skipping comment post.');
      return;
    }

    // Post comment to the original PR using Octokit
    core.info(`Posting comment to PR #${prNumber}...`);

    // Parse repository string (format: owner/repo)
    const [owner, repo] = repository.split('/');
    if (!owner || !repo) {
      throw new Error(`Invalid repository format. Expected 'owner/repo', got '${repository}'`);
    }

    // Initialize Octokit client
    const octokit = github.getOctokit(githubToken);

    // Post comment using Octokit
    const commentResponse = await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: parseInt(prNumber),
      body: commentBody
    });

    core.info('Comment response:');
    core.info(JSON.stringify(commentResponse.data, null, 2));
  } catch (error) {
    core.warning(`Failed to post PR comment: ${error.message}`);
    // Don't fail the action if posting comment fails
  }
}

function generateDefaultCommentBody(prResponseStr) {
  try {
    const prResponse = typeof prResponseStr === 'string' ? JSON.parse(prResponseStr) : prResponseStr;
    return `## Veracode Fix for SCA

A pull request has been created with automated fixes for SCA vulnerabilities.

**PR Details:**
- **Title:** ${prResponse.title || 'N/A'}
- **URL:** ${prResponse.html_url || 'N/A'}
- **Status:** ${prResponse.state || 'N/A'}

Please review the changes and merge if appropriate.`;
  } catch (error) {
    return 'A pull request has been created with automated fixes for Veracode SCA vulnerabilities. Please review the changes.';
  }
}

module.exports = postPrComment;
