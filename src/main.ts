import * as core from '@actions/core';
import { shouldSkipBranch } from './utils';
import { getInputs } from './action-inputs';
import { GithubConnector } from './github-connector';
import { JiraConnector } from './jira-connector';
import { convert } from 'html-to-text'

async function run(): Promise<void> {
  const { FAIL_WHEN_JIRA_ISSUE_NOT_FOUND } = getInputs();
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
    if (!issueKey) throw core.error;

    console.log(`JIRA key -> ${issueKey}`);

    const jiraDetails = await jiraConnector.getTicketDetails(issueKey);
    const prData = await githubConnector.updatePrDetails(jiraDetails)  || '';
    const prLink = `https://github.com/PerkinElmer/signals/pull/${prData.pull_number}`
    const options = {preserveNewlines:true,wordwrap:130};
    let prBodyText = (prData.body || '').replace(/#/g,"")
    prBodyText = prBodyText.substring(
        prBodyText.lastIndexOf("Description"),
        prBodyText.lastIndexOf("Checklist")
      );
    const prDescription = prLink + "\n\n" + convert(prBodyText,options);
    await jiraConnector.addTicketComment(issueKey,prDescription);
  } catch (error) {
    console.log(error);
    console.log('JIRA key was not found');
   if (FAIL_WHEN_JIRA_ISSUE_NOT_FOUND) {
     console.log({ error });
     core.setFailed(error.message);
     process.exit(1);
   } else {
     process.exit(0);
   }
  }
}

run();
