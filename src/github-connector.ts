import { context, getOctokit } from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';
import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types';
import { getInputs } from './action-inputs';
import { ESource, IGithubData, JIRADetails, PullRequestParams } from './types';
import { buildPRDescription, getJIRAIssueKeyByDefaultRegexp, getJIRAIssueKeysByCustomRegexp, getPRDescription } from './utils';

export class GithubConnector {
  githubData: IGithubData = {} as IGithubData;
  octokit: InstanceType<typeof GitHub>;

  constructor() {
    const { GITHUB_TOKEN } = getInputs();

    this.octokit = getOctokit(GITHUB_TOKEN);

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

    const nextBody = getPRDescription(recentBody, buildPRDescription(details))
    if (nextBody === recentBody) {
      console.info('edit would not change ticket body')
      return undefined
    }
    console.log('diff', { nextBody, recentBody })
    const prData: RestEndpointMethodTypes['pulls']['update']['parameters'] = {
      owner,
      repo,
      pull_number: prNumber,
      body: nextBody,
    };

    return await this.octokit.rest.pulls.update(prData);
  }

  // PR description may have been updated by some other action in the same job, need to re-fetch it to get the latest
  async getLatestPRDescription({ owner, repo, number }: { owner: string; repo: string; number: number }): Promise<string> {
    return this.octokit.rest.pulls
      .get({
        owner,
        repo,
        pull_number: number,
      })
      .then(({ data }: RestEndpointMethodTypes['pulls']['get']['response']) => {
        return data.body || '';
      });
  }

  private getGithubData(): IGithubData {
    const {
      eventName,
      payload: { repository, pull_request: pullRequest },
    } = context;

    let owner: IGithubData['owner'] | undefined;

    if (context?.payload?.organization) {
      owner = context?.payload?.organization?.login;
    } else {
      console.log('Could not find organization, using repository owner instead.');
      owner = context.payload.repository?.owner.login;
    }

    if (!owner) {
      throw new Error('Could not find owner.');
    }

    return {
      eventName,
      repository,
      owner,
      pullRequest: pullRequest as PullRequestParams,
    };
  }
}
