import { GithubConnector } from '../src/github-connector';
import { GitHub } from '@actions/github/lib/github';
import { ESource, IActionInputs } from '../src/types';
import { describe } from 'jest-circus';
import { getJIRAIssueKeyByDefaultRegexp, getJIRAIssueKeysByCustomRegexp } from '../src/utils';
import { getInputs } from '../src/action-inputs';

const MOCK_INPUT: Partial<IActionInputs> = {
  GITHUB_TOKEN: 'GITHUB_TOKEN',
};

const BRANCH_NAME = 'branchName';
const PR_TITLE = 'prTitle';

jest.mock('@actions/github/lib/github', () => {
  const MOCK_CONTEXT = {
    eventName: 'eventName',
    payload: {
      repository: 'repository',
      organization: { login: { owner: 'owner' } },
      pull_request: { title: 'prTitle', head: { ref: 'branchName' } },
    },
  };
  return {
    GitHub: jest.fn(),
    context: MOCK_CONTEXT,
  };
});

jest.mock('../src/action-inputs');
jest.mock('../src/utils');

describe('Github connector()', () => {
  let connector: GithubConnector;

  it('initializes correctly', () => {
    (getInputs as any).mockImplementation(() => MOCK_INPUT);
    connector = new GithubConnector();
    expect(GitHub).toHaveBeenCalledWith(MOCK_INPUT.GITHUB_TOKEN);
  });

  describe('getIssueKeyFromTitle()', () => {
    describe('if some CUSTOM_ISSUE_NUMBER_REGEXP is empty', () => {
      const INPUTS_MOCK = {
        ...MOCK_INPUT,
        ...{
          CUSTOM_ISSUE_NUMBER_REGEXP: '',
        },
      };
      const getJIRAIssueKeyReturnValue = 'getJIRAIssueKeyByDefaultRegexp';
      beforeEach(() => {
        (getJIRAIssueKeyByDefaultRegexp as any).mockImplementation(() => getJIRAIssueKeyReturnValue);
      });

      it('calls getJIRAIssueKeyByDefaultRegexp method with branch name if WHAT_TO_USE === branch', () => {
        (getInputs as any).mockImplementation(() => ({ ...INPUTS_MOCK, WHAT_TO_USE: ESource.branch }));
        connector = new GithubConnector();

        const jiraIssue = connector.getIssueKeyFromTitle();
        expect(jiraIssue.key).toEqual(getJIRAIssueKeyReturnValue);
        expect(jiraIssue.source).toEqual(ESource.branch);
        expect(getJIRAIssueKeyByDefaultRegexp).toHaveBeenCalledWith(BRANCH_NAME);
      });

      it('calls getJIRAIssueKeyByDefaultRegexp method with PR title if  USE_BRANCH_NAME == pr-title', () => {
        (getInputs as any).mockImplementation(() => ({ ...INPUTS_MOCK, WHAT_TO_USE: ESource.prTitle }));
        connector = new GithubConnector();

        const jiraIssue = connector.getIssueKeyFromTitle();
        expect(jiraIssue.key).toEqual(getJIRAIssueKeyReturnValue);
        expect(jiraIssue.source).toEqual(ESource.prTitle);
        expect(getJIRAIssueKeyByDefaultRegexp).toHaveBeenCalledWith(PR_TITLE);
      });

      describe('calls getJIRAIssueKeyByDefaultRegexp method with PR title and branch name if USE_BRANCH_NAME == both', () => {
        it('and returns pr-title result with a priority', () => {
          (getInputs as any).mockImplementation(() => ({ ...INPUTS_MOCK, WHAT_TO_USE: ESource.prTitle }));
          (getJIRAIssueKeyByDefaultRegexp as any).mockImplementation((str: string) => (str === PR_TITLE ? PR_TITLE : null));
          connector = new GithubConnector();

          const jiraIssue = connector.getIssueKeyFromTitle();
          expect(jiraIssue.key).toEqual(PR_TITLE);
          expect(jiraIssue.source).toEqual(ESource.prTitle);
          expect(getJIRAIssueKeyByDefaultRegexp).toHaveBeenCalledWith(PR_TITLE);
          expect(getJIRAIssueKeyByDefaultRegexp).not.toHaveBeenCalledWith(BRANCH_NAME);
        });

        it('and returns branch result only if pr-title result is null', () => {
          (getInputs as any).mockImplementation(() => ({ ...INPUTS_MOCK, WHAT_TO_USE: ESource.both }));
          (getJIRAIssueKeyByDefaultRegexp as any).mockImplementation((str: string) => (str === PR_TITLE ? null : BRANCH_NAME));
          connector = new GithubConnector();

          const jiraIssue = connector.getIssueKeyFromTitle();
          expect(jiraIssue.key).toEqual(BRANCH_NAME);
          expect(jiraIssue.source).toEqual(ESource.branch);
          expect(getJIRAIssueKeyByDefaultRegexp).toHaveBeenCalledWith(PR_TITLE);
          expect(getJIRAIssueKeyByDefaultRegexp).toHaveBeenCalledWith(BRANCH_NAME);
        });
      });
    });

    describe('if both JIRA_PROJECT_KEY and CUSTOM_ISSUE_NUMBER_REGEXP are not empty', () => {
      const INPUTS_MOCK = {
        ...MOCK_INPUT,
        ...{
          JIRA_PROJECT_KEY: 'JIRA_PROJECT_KEY',
          CUSTOM_ISSUE_NUMBER_REGEXP: 'CUSTOM_ISSUE_NUMBER_REGEXP',
        },
      };

      const getJIRAIssueKeysByCustomRegexpReturnValue = 'getJIRAIssueKeysByCustomRegexp';

      beforeEach(() => {
        (getJIRAIssueKeysByCustomRegexp as any).mockImplementation(() => getJIRAIssueKeysByCustomRegexpReturnValue);
      });

      it('calls getJIRAIssueKeysByCustomRegexp method with branch name if USE_BRANCH_NAME === branch', () => {
        (getInputs as any).mockImplementation(() => ({ ...INPUTS_MOCK, WHAT_TO_USE: ESource.branch }));
        connector = new GithubConnector();

        const jiraIssue = connector.getIssueKeyFromTitle();
        expect(jiraIssue.key).toEqual(getJIRAIssueKeysByCustomRegexpReturnValue);
        expect(jiraIssue.source).toEqual(ESource.branch);
        expect(getJIRAIssueKeysByCustomRegexp).toHaveBeenCalledWith(
          BRANCH_NAME,
          INPUTS_MOCK.CUSTOM_ISSUE_NUMBER_REGEXP,
          INPUTS_MOCK.JIRA_PROJECT_KEY
        );
      });

      it('calls getJIRAIssueKeysByCustomRegexp method with PR title if  USE_BRANCH_NAME === pr-title', () => {
        (getInputs as any).mockImplementation(() => ({ ...INPUTS_MOCK, WHAT_TO_USE: ESource.prTitle }));
        connector = new GithubConnector();

        const jiraIssue = connector.getIssueKeyFromTitle();
        expect(jiraIssue.key).toEqual(getJIRAIssueKeysByCustomRegexpReturnValue);
        expect(jiraIssue.source).toEqual(ESource.prTitle);
        expect(getJIRAIssueKeysByCustomRegexp).toHaveBeenCalledWith(PR_TITLE, INPUTS_MOCK.CUSTOM_ISSUE_NUMBER_REGEXP, INPUTS_MOCK.JIRA_PROJECT_KEY);
      });

      describe('calls getJIRAIssueKeysByCustomRegexp method with PR title and branch name if USE_BRANCH_NAME == both', () => {
        it('and returns pr-title result with a priority', () => {
          (getInputs as any).mockImplementation(() => ({ ...INPUTS_MOCK, WHAT_TO_USE: ESource.prTitle }));
          (getJIRAIssueKeysByCustomRegexp as any).mockImplementation((str: string) => (str === PR_TITLE ? PR_TITLE : null));
          connector = new GithubConnector();

          const jiraIssue = connector.getIssueKeyFromTitle();
          expect(jiraIssue.key).toEqual(PR_TITLE);
          expect(jiraIssue.source).toEqual(ESource.prTitle);
          expect(getJIRAIssueKeysByCustomRegexp).toHaveBeenCalledWith(PR_TITLE, INPUTS_MOCK.CUSTOM_ISSUE_NUMBER_REGEXP, INPUTS_MOCK.JIRA_PROJECT_KEY);
          expect(getJIRAIssueKeysByCustomRegexp).not.toHaveBeenCalledWith(
            BRANCH_NAME,
            INPUTS_MOCK.CUSTOM_ISSUE_NUMBER_REGEXP,
            INPUTS_MOCK.JIRA_PROJECT_KEY
          );
        });

        it('and returns branch result only if pr-title result is null', () => {
          (getInputs as any).mockImplementation(() => ({ ...INPUTS_MOCK, WHAT_TO_USE: ESource.both }));
          (getJIRAIssueKeysByCustomRegexp as any).mockImplementation((str: string) => (str === PR_TITLE ? null : BRANCH_NAME));
          connector = new GithubConnector();

          const jiraIssue = connector.getIssueKeyFromTitle();
          expect(jiraIssue.key).toEqual(BRANCH_NAME);
          expect(jiraIssue.source).toEqual(ESource.branch);
          expect(getJIRAIssueKeysByCustomRegexp).toHaveBeenCalledWith(PR_TITLE, INPUTS_MOCK.CUSTOM_ISSUE_NUMBER_REGEXP, INPUTS_MOCK.JIRA_PROJECT_KEY);
          expect(getJIRAIssueKeysByCustomRegexp).toHaveBeenCalledWith(
            BRANCH_NAME,
            INPUTS_MOCK.CUSTOM_ISSUE_NUMBER_REGEXP,
            INPUTS_MOCK.JIRA_PROJECT_KEY
          );
        });
      });
    });
  });
});
