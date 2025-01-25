export type Context = {
  req: any;
  token: string | null;
  user: any;
  isAuthenticated: boolean;
};
