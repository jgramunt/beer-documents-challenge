export interface Contributor {
  ID: string;
  Name: string;
}

export interface Document {
  ID: string;
  Title: string;
  Version: string;
  CreatedAt: string;
  UpdatedAt: string;
  Contributors: Contributor[];
  Attachments: string[];
  isUserCreated?: boolean;
}
