import { getInputs } from './action-inputs';
import axios, { AxiosInstance } from 'axios';
import { JIRA } from './types';
import { GithubConnector } from './github-connector';

export class JiraConnector {
  client: AxiosInstance;
  JIRA_TOKEN: string;
  JIRA_BASE_URL: string;

  constructor() {
    const { JIRA_TOKEN, JIRA_BASE_URL } = getInputs();

    this.JIRA_BASE_URL = JIRA_BASE_URL;
    this.JIRA_TOKEN = JIRA_TOKEN;

    const encodedToken = Buffer.from(JIRA_TOKEN).toString('base64');

    this.client = axios.create({
      baseURL: `${JIRA_BASE_URL}/rest/api/3`,
      timeout: 2000,
      headers: { Authorization: `Basic ${encodedToken}` },
    });
  }

  async getTicketDetails(key: string, pr_status: string): Promise<void> {
    try {
      const url = `/issue/${key}?fields=project,summary,issuetype`;
      const response = await this.client.get<JIRA.Issue>(url);
      const issue: JIRA.Issue = response.data;
      const {
        fields: { issuetype: type, project, summary },
      } = issue;

      const details = {
        key,
        summary,
        url: `${this.JIRA_BASE_URL}/browse/${key}`,
        type: {
          name: type.name,
          icon: type.iconUrl,
        },
        project: {
          name: project.name,
          url: `${this.JIRA_BASE_URL}/browse/${project.key}`,
          key: project.key,
        },
      };
      const githubConnector = new GithubConnector();
      await githubConnector.updatePrDetails(details);
    } catch (error) {
      if (error.response) {
        console.log('Something went wrong in fetching the Jira issues!');
        console.log('Error code - ' + error.response.status);
        console.log(error.response.data);
      }
      if (pr_status === 'true') {
        console.log('Setting PR status as failed');
        process.exit(1);
      } else {
        console.log('Ignore the errors and set PR status as success');
        process.exit(0);
      }
    }
  }
}
