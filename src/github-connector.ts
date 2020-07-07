import { getInputs } from './action-inputs'
import { IGithubData, JIRADetails, PullRequestParams } from './types'
import { PullsUpdateParams } from '@octokit/rest'
import { buildPRDescription, getJIRAIssueKey, getJIRAIssueKeysByCustomRegexp, getPRDescription } from './utils'
import { context, GitHub } from '@actions/github/lib/github'

export class GithubConnector {
  client: GitHub = {} as GitHub
  githubData: IGithubData = {} as IGithubData

  constructor() {
    const { GITHUB_TOKEN } = getInputs()
    this.client = new GitHub(GITHUB_TOKEN)
    this.githubData = this.getGithubData()
  }

  get isPRAction(): boolean {
    return this.githubData.eventName === 'pull_request'
  }

  get headBranch(): string {
    return this.githubData.pullRequest.head.ref
  }

  getIssueKeyFromTitle(): string | null {
    const { JIRA_PROJECT_KEY, CUSTOM_ISSUE_NUMBER_REGEXP, USE_BRANCH_NAME } = getInputs()

    const shouldUseCustomRegexp = !!CUSTOM_ISSUE_NUMBER_REGEXP && !!JIRA_PROJECT_KEY
    const prTitle = this.githubData.pullRequest.title
    const branchName = this.headBranch
    const stringToParse = USE_BRANCH_NAME ? branchName : prTitle

    if (!stringToParse) {
      if (USE_BRANCH_NAME) {
        console.log(`JIRA issue id is missing in your branch ${branchName}, doing nothing`)
      } else {
        console.log(`JIRA issue id is missing in your PR title ${prTitle}, doing nothing`)
      }

      return null
    }

    return shouldUseCustomRegexp
      ? getJIRAIssueKeysByCustomRegexp(stringToParse, CUSTOM_ISSUE_NUMBER_REGEXP, JIRA_PROJECT_KEY)
      : getJIRAIssueKey(stringToParse)
  }

  async updatePrDetails(details: JIRADetails) {
    const owner = this.githubData.owner
    const repo = this.githubData.repository.name

    const { number: prNumber = 0, body: prBody = '' } = this.githubData.pullRequest

    const prData: PullsUpdateParams = {
      owner,
      repo,
      pull_number: prNumber,
      body: getPRDescription(prBody, buildPRDescription(details)),
    }

    return await this.client.pulls.update(prData)
  }

  private getGithubData(): IGithubData {
    const {
      eventName,
      payload: {
        repository,
        organization: { login: owner },
        pull_request: pullRequest,
      },
    } = context

    return {
      eventName,
      repository,
      owner,
      pullRequest: pullRequest as PullRequestParams,
    }
  }
}
