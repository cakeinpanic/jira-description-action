import * as core from '@actions/core';
import { ESource } from './types';
import { shouldSkipBranch } from './utils';
import { getInputs } from './action-inputs';
import { GithubConnector } from './github-connector';
import { JiraConnector } from './jira-connector';

async function run(): Promise<void> {
  const { FAIL_WHEN_JIRA_ISSUE_NOT_FOUND } = getInputs();

  try {
    const { BRANCH_IGNORE_PATTERN } = getInputs();

    const githubConnector = new GithubConnector();
    const jiraConnector = new JiraConnector();

    if (!githubConnector.isPRAction) {
      console.log('This action meant to be run only on PRs');
      setOutputs(false, null);
      process.exit(0);
    }

    if (shouldSkipBranch(githubConnector.headBranch, BRANCH_IGNORE_PATTERN)) {
      setOutputs(false, null);
      process.exit(0);
    }

    const { key, source } = githubConnector.getIssueKeyFromTitle();

    const details = await jiraConnector.getTicketDetails(key);
    await githubConnector.updatePrDetails(details);

    setOutputs(true, source);

  } catch (error) {
    console.log('Failed to add JIRA description to PR.');
    core.error(error.message);
    setOutputs(false, null);
    if (FAIL_WHEN_JIRA_ISSUE_NOT_FOUND) {
      core.setFailed(error.message);
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

function setOutputs(isFound: boolean, source: ESource | null): void {
  core.setOutput('jira-issue-found', isFound);
  core.setOutput('jira-issue-source', source || 'null');

}

run();
