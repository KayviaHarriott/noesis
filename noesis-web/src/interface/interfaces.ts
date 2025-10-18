export interface ClientDetails {
  name: string;
  id: string;
  company?: string;
  sentiment?: string;
}

export interface AgentDetails {
  name: string;
  id: string;
  experienceLevel?: string;
  availability?: boolean;
}
export interface aiCoachingResponseDetails {
  summary: string;
  suggestions: string[] | string;
}