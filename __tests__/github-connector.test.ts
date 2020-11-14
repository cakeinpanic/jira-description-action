import { GithubConnector } from '../src/github-connector';
import { GitHub } from '@actions/github/lib/github';
import { IActionInputs } from '../src/types';
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
    describe('if some of JIRA_PROJECT_KEY and CUSTOM_ISSUE_NUMBER_REGEXP are empty', () => {
      const INPUTS_MOCK = {
        ...MOCK_INPUT,
        ...{
          JIRA_PROJECT_KEY: '',
          CUSTOM_ISSUE_NUMBER_REGEXP: 'CUSTOM_ISSUE_NUMBER_REGEXP',
        },
      };
      const getJIRAIssueKeyReturnValue = 'getJIRAIssueKeyByDefaultRegexp';
      beforeEach(() => {
        (getJIRAIssueKeyByDefaultRegexp as any).mockImplementation(() => getJIRAIssueKeyReturnValue);
      });
      it('calls getJIRAIssueKeyByDefaultRegexp method with branch name if USE_BRANCH_NAME === true', () => {
        (getInputs as any).mockImplementation(() => ({ ...INPUTS_MOCK, USE_BRANCH_NAME: true }));
        connector = new GithubConnector();

        expect(connector.getIssueKeyFromTitle()).toEqual(getJIRAIssueKeyReturnValue);
        expect(getJIRAIssueKeyByDefaultRegexp).toHaveBeenCalledWith(BRANCH_NAME);
      });

      it('calls getJIRAIssueKeyByDefaultRegexp method with PR title if  USE_BRANCH_NAME !== true', () => {
        (getInputs as any).mockImplementation(() => ({ ...INPUTS_MOCK, USE_BRANCH_NAME: false }));
        connector = new GithubConnector();

        expect(connector.getIssueKeyFromTitle()).toEqual(getJIRAIssueKeyReturnValue);
        expect(getJIRAIssueKeyByDefaultRegexp).toHaveBeenCalledWith(PR_TITLE);
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
      it('calls getJIRAIssueKeysByCustomRegexp method with branch name if USE_BRANCH_NAME === true', () => {
        (getInputs as any).mockImplementation(() => ({ ...INPUTS_MOCK, USE_BRANCH_NAME: true }));
        connector = new GithubConnector();

        expect(connector.getIssueKeyFromTitle()).toEqual(getJIRAIssueKeysByCustomRegexpReturnValue);
        expect(getJIRAIssueKeysByCustomRegexp).toHaveBeenCalledWith(
          BRANCH_NAME,
          INPUTS_MOCK.CUSTOM_ISSUE_NUMBER_REGEXP,
          INPUTS_MOCK.JIRA_PROJECT_KEY
        );
      });

      it('calls getJIRAIssueKeyByDefaultRegexp method with PR title if  USE_BRANCH_NAME !== true', () => {
        (getInputs as any).mockImplementation(() => ({ ...INPUTS_MOCK, USE_BRANCH_NAME: false }));
        connector = new GithubConnector();

        expect(connector.getIssueKeyFromTitle()).toEqual(getJIRAIssueKeysByCustomRegexpReturnValue);
        expect(getJIRAIssueKeysByCustomRegexp).toHaveBeenCalledWith(PR_TITLE, INPUTS_MOCK.CUSTOM_ISSUE_NUMBER_REGEXP, INPUTS_MOCK.JIRA_PROJECT_KEY);
      });
    });
  });
});
