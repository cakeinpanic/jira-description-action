import * as core from '@actions/core';
import { shouldSkipBranch } from './utils';
import { getInputs } from './action-inputs';
import { GithubConnector } from './github-connector';
import { JiraConnector } from './jira-connector';

async function run(): Promise<void> {
  const { FAIL_WHEN_JIRA_ISSUE_NOT_FOUND } = getInputs();
  let jiraIssueFound = false;
  let jiraIssueSource = null;

  try {
    const { BRANCH_IGNORE_PATTERN } = getInputs();

    const githubConnector = new GithubConnector();
    const jiraConnector = new JiraConnector();

    if (!githubConnector.isPRAction) {
      console.log('This action meant to be run only on PRs');
      process.exit(0);
    }

    if (shouldSkipBranch(githubConnector.headBranch, BRANCH_IGNORE_PATTERN)) {
      process.exit(0);
    }

    const { key, source } = githubConnector.getIssueKeyFromTitle();

    const details = await jiraConnector.getTicketDetails(key);
    await githubConnector.updatePrDetails(details);

    jiraIssueFound = true;
    jiraIssueSource = source;
  } catch (error) {
    console.log('JIRA key was not found');
    core.error(error.message);

    if (FAIL_WHEN_JIRA_ISSUE_NOT_FOUND) {
      core.setFailed(error.message);
      process.exit(1);
    } else {
      process.exit(0);
    }
  } finally {
    core.setOutput('jira-issue-found', jiraIssueFound.toString());
    core.setOutput('jira-issue-source', jiraIssueSource);
  }
}

run();
