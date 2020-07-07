import { getJIRAIssueKey, getJIRAIssueKeysByCustomRegexp, getPRDescription, shouldSkipBranch } from '../src/utils';
import { HIDDEN_MARKER_END, HIDDEN_MARKER_START, WARNING_MESSAGE_ABOUT_HIDDEN_MARKERS } from '../src/constants';

jest.spyOn(console, 'log').mockImplementation(); // avoid actual console.log in test output

describe('shouldSkipBranch()', () => {
  it('should recognize bot PRs', () => {
    expect(shouldSkipBranch('dependabot/npm_and_yarn/types/react-dom-16.9.6')).toBe(true);
    expect(shouldSkipBranch('feature/add-dependabot-config')).toBe(false);
  });

  it('should handle custom ignore patterns', () => {
    expect(shouldSkipBranch('bar', '^bar')).toBeTruthy();
    expect(shouldSkipBranch('foobar', '^bar')).toBeFalsy();

    expect(shouldSkipBranch('bar', '[0-9]{2}')).toBeFalsy();
    expect(shouldSkipBranch('bar', '')).toBeFalsy();
    expect(shouldSkipBranch('f00', '[0-9]{2}')).toBeTruthy();

    const customBranchRegex = '^(production-release|master|release/v\\d+)$';

    expect(shouldSkipBranch('production-release', customBranchRegex)).toBeTruthy();
    expect(shouldSkipBranch('master', customBranchRegex)).toBeTruthy();
    expect(shouldSkipBranch('release/v77', customBranchRegex)).toBeTruthy();

    expect(shouldSkipBranch('release/very-important-feature', customBranchRegex)).toBeFalsy();
    expect(shouldSkipBranch('')).toBeFalsy();
  });
});

describe('getJIRAIssueKeys()', () => {
  it('gets jira key from different strings', () => {
    expect(getJIRAIssueKey('fix/login-protocol-es-43')).toEqual('ES-43');
    expect(getJIRAIssueKey('fix/login-protocol-ES-43')).toEqual('ES-43');
    expect(getJIRAIssueKey('[ES-43, ES-15] Feature description')).toEqual('ES-43');

    expect(getJIRAIssueKey('feature/missingKey')).toEqual(null);
    expect(getJIRAIssueKey('')).toEqual(null);
  });
});

describe('getJIRAIssueKeysByCustomRegexp()', () => {
  it('gets jira keys from different strings', () => {
    expect(getJIRAIssueKeysByCustomRegexp('18,345', '\\d+', 'PRJ')).toEqual('PRJ-18');
    expect(getJIRAIssueKeysByCustomRegexp('fix/login-protocol-es-43', '^\\d+', 'QQ')).toEqual(null);
    expect(getJIRAIssueKeysByCustomRegexp('43-login-protocol', '^\\d+', 'QQ')).toEqual('QQ-43');
  });
});

describe('getPRDescription()', () => {
  it('should prepend issue info with hidden markers to old PR body', () => {
    const oldPRBody = 'old PR description body';
    const issueInfo = 'new info about jira task';
    const description = getPRDescription(oldPRBody, issueInfo);

    expect(description).toEqual(`${WARNING_MESSAGE_ABOUT_HIDDEN_MARKERS}
${HIDDEN_MARKER_START}
${issueInfo}
${HIDDEN_MARKER_END}
${oldPRBody}`);
  });

  it('should replace issue info', () => {
    const oldPRBodyInformation = 'old PR description body';
    const oldPRBody = `${HIDDEN_MARKER_START}Here is some old issue information${HIDDEN_MARKER_END}${oldPRBodyInformation}`;
    const issueInfo = 'new info about jira task';

    const description = getPRDescription(oldPRBody, issueInfo);

    expect(description).toEqual(`${WARNING_MESSAGE_ABOUT_HIDDEN_MARKERS}
${HIDDEN_MARKER_START}
${issueInfo}
${HIDDEN_MARKER_END}
${oldPRBodyInformation}`);
  });
});
