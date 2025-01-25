export type User = {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'HOST' | 'ADMIN';
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type RegisterMutation = {
  register: AuthResponse;
};

export type LoginMutation = {
  login: AuthResponse;
};

export type MeQuery = {
  me: User;
};
