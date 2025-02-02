export interface Prefix {
  _id: string;
  prefix: string;
  metadata: {
    description: string;
    accounts: string[];
  };
  dateCreated: Date;
  dateUpdated: Date;
}
