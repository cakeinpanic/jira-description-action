import { context, GitHub } from '@actions/github/lib/github';
import Octokit, { PullsUpdateParams } from '@octokit/rest';
import { getInputs } from './action-inputs';
import { ESource, IGithubData, JIRADetails, PullRequestParams } from './types';
import { buildPRDescription, getJIRAIssueKeyByDefaultRegexp, getJIRAIssueKeysByCustomRegexp, getPRDescription } from './utils';

export class GithubConnector {
  client: GitHub = {} as GitHub;
  githubData: IGithubData = {} as IGithubData;
  octokit: Octokit;

  constructor() {
    const { GITHUB_TOKEN } = getInputs();
    this.client = new GitHub(GITHUB_TOKEN);
    this.octokit = new Octokit({ auth: GITHUB_TOKEN });

    this.githubData = this.getGithubData();
  }

  get isPRAction(): boolean {
    return this.githubData.eventName === 'pull_request' || this.githubData.eventName === 'pull_request_target';
  }

  get headBranch(): string {
    return this.githubData.pullRequest.head.ref;
  }

  getIssueKeyFromTitle(): { key: string; source: ESource } {
    const { WHAT_TO_USE } = getInputs();

    const prTitle = this.githubData.pullRequest.title || '';
    const branchName = this.headBranch;

    let keyFound: string | null = null;
    let source: ESource | null = null;

    switch (WHAT_TO_USE) {
      case ESource.branch:
        keyFound = this.getIssueKeyFromString(branchName);
        source = keyFound ? ESource.branch : null;
        break;
      case ESource.prTitle:
        keyFound = this.getIssueKeyFromString(prTitle);
        source = keyFound ? ESource.prTitle : null;
        break;
      case ESource.both:
        const keyByPRTitle = this.getIssueKeyFromString(prTitle);
        if (keyByPRTitle) {
          keyFound = keyByPRTitle;
          source = ESource.prTitle;
        } else {
          keyFound = this.getIssueKeyFromString(branchName);
          source = keyFound ? ESource.branch : null;
        }
        break;
    }

    if (!keyFound || !source) {
      throw new Error('JIRA key not found');
    }
    console.log(`JIRA key found -> ${keyFound} from ${source}`);
    return { key: keyFound, source };
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
    console.log('Updating PR details');
    const { number: prNumber = 0 } = this.githubData.pullRequest;
    const recentBody = await this.getLatestPRDescription({ repo, owner, number: this.githubData.pullRequest.number });

    const prData: PullsUpdateParams = {
      owner,
      repo,
      pull_number: prNumber,
      body: getPRDescription(recentBody, buildPRDescription(details)),
    };

    return await this.client.pulls.update(prData);
  }

  // PR description may have been updated by some other action in the same job, need to re-fetch it to get the latest
  async getLatestPRDescription({ owner, repo, number }: { owner: string; repo: string; number: number }): Promise<string> {
    return this.octokit.pulls
      .get({
        owner,
        repo,
        pull_number: number,
      })
      .then(({ data }: { data: PullRequestParams }) => {
        return data.body || '';
      });
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
