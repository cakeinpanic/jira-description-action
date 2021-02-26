import * as core from '@actions/core';
import { shouldSkipBranch } from './utils';
import { getInputs } from './action-inputs';
import { GithubConnector } from './github-connector';
import { JiraConnector } from './jira-connector';

async function run(): Promise<void> {
  const { FAIL_PR_WHEN_JIRA_ISSUE_NOT_FOUND } = getInputs();
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

    const issueKey = githubConnector.getIssueKeyFromTitle();

    if (!issueKey) {
      console.log(`JIRA key was not found`);
      if (FAIL_PR_WHEN_JIRA_ISSUE_NOT_FOUND === 'true') {
        console.log('Setting PR status as failed');
        process.exit(1);
      } else {
        console.log('Ignore the errors and set PR status as success');
        process.exit(0);
      }
    }

    console.log(`JIRA key -> ${issueKey}`);

    await jiraConnector.getTicketDetails(issueKey, FAIL_PR_WHEN_JIRA_ISSUE_NOT_FOUND);
  } catch (error) {
    console.log('Something went wrong!');
    console.log({ error });
    core.setFailed(error.message);
  }
}

run();
