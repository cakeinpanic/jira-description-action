import { context, GitHub } from '@actions/github/lib/github';
import { PullsUpdateParams } from '@octokit/rest';
import { getInputs } from './action-inputs';
import { ESource, IGithubData, JIRADetails, PullRequestParams } from './types';
import { buildPRDescription, getJIRAIssueKeyByDefaultRegexp, getJIRAIssueKeysByCustomRegexp, getPRDescription } from './utils';

export class GithubConnector {
  client: GitHub = {} as GitHub;
  githubData: IGithubData = {} as IGithubData;

  constructor() {
    const { GITHUB_TOKEN } = getInputs();
    this.client = new GitHub(GITHUB_TOKEN);
    this.githubData = this.getGithubData();
  }

  get isPRAction(): boolean {
    return this.githubData.eventName === 'pull_request';
  }

  get headBranch(): string {
    return this.githubData.pullRequest.head.ref;
  }

  getIssueKeyFromTitle(): string | null {
    const { WHAT_TO_USE } = getInputs();

    const prTitle = this.githubData.pullRequest.title || '';
    const branchName = this.headBranch;

    if (WHAT_TO_USE === ESource.both) {
      return this.getIssueKeyFromString(prTitle) || this.getIssueKeyFromString(branchName);
    }

    return WHAT_TO_USE === ESource.branch ? this.getIssueKeyFromString(branchName) : this.getIssueKeyFromString(prTitle);
  }

  private getIssueKeyFromString(stringToParse: string): string | null {
    const { JIRA_PROJECT_KEY, CUSTOM_ISSUE_NUMBER_REGEXP } = getInputs();
    const shouldUseCustomRegexp = !!CUSTOM_ISSUE_NUMBER_REGEXP;

    console.log(`looking in: ${stringToParse}`);

    return shouldUseCustomRegexp
      ? getJIRAIssueKeysByCustomRegexp(stringToParse, CUSTOM_ISSUE_NUMBER_REGEXP, JIRA_PROJECT_KEY)
      : getJIRAIssueKeyByDefaultRegexp(stringToParse);
  }

  async updatePrDetails(details: JIRADetails) {
    const owner = this.githubData.owner;
    const repo = this.githubData.repository.name;

    const { number: prNumber = 0, body: prBody = '' } = this.githubData.pullRequest;

    const prData: PullsUpdateParams = {
      owner,
      repo,
      pull_number: prNumber,
      body: getPRDescription(prBody, buildPRDescription(details)),
    };

    return await this.client.pulls.update(prData);
  }

  private getGithubData(): IGithubData {
    const {
      eventName,
      payload: {
        repository,
        organization: { login: owner },
        pull_request: pullRequest,
      },
    } = context;

    return {
      eventName,
      repository,
      owner,
      pullRequest: pullRequest as PullRequestParams,
    };
  }
}
