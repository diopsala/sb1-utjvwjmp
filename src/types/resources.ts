export interface Resource {
  id: string;
  title: string;
  subject: string;
  level: string;
  type: string;
  difficulty: number;
  tags: string[];
  language: string;
  year: string;
  file_url: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}