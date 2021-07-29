import { getInputs } from './action-inputs';
import axios, { AxiosInstance } from 'axios';
import { JIRA, JIRADetails } from './types';

export class JiraConnector {
  client: AxiosInstance;
  JIRA_TOKEN: string;
  JIRA_BASE_URL: string;

  constructor() {
    const { JIRA_TOKEN, JIRA_BASE_URL, JIRA_USER, JIRA_PASSWORD } = getInputs();

    this.JIRA_BASE_URL = JIRA_BASE_URL;
    this.JIRA_TOKEN = JIRA_TOKEN;


    this.client = axios.create({
      baseURL: `${JIRA_BASE_URL}/rest/api/2`,
      timeout: 2000,
      auth: {
        username: JIRA_USER,
        password: JIRA_PASSWORD
      }
    });
  }

  async getTicketDetails(key: string): Promise<JIRADetails> {
    try {
      const issue: JIRA.Issue = await this.getIssue(key);
      const {
        fields: { issuetype: type, project, summary },
      } = issue;

      return {
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
    } catch (error) {
      if (error.response) {
        console.log(error.response.data);
      }
      throw error;
    }
  }

  async addTicketComment(key: string): Promise<JIRADetails> {
    try {
      const issue: JIRA.Issue = await this.getIssue(key);
      const {
        fields: { issuetype: type, project, summary },
      } = issue;

      await this.addComment(key);

      return {
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
    } catch (error) {
      if (error.response) {
        console.log(error.response.data);
      }
      throw error;
    }
  }

  async addComment(id: string): Promise<JIRA.Issue> {
    const url = `/issue/${id}/comment`;
    const response = await this.client.post<JIRA.Issue>(url,{
      body: 'test comment'
    });
    return response.data;
  }

  async getIssue(id: string): Promise<JIRA.Issue> {
    const url = `/issue/${id}?fields=project,summary,issuetype`;
    const response = await this.client.get<JIRA.Issue>(url);
    return response.data;
  }
}
