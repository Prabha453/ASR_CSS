export type LoginCredentials = {
  portNumber: string;
  email: string;
  password: string;
};

export type PortResolveData = {
  port_name: string;
  port_db: string;
  port_number: string;
};

export type LoginResponse = {
  status: boolean;
  message?: string;
  data: Record<string, unknown>;
  tokens: {
    access: { token: string };
    refresh: { token: string };
  };
};
