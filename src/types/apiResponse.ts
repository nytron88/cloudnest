export type APIResponse<T = unknown, E = unknown> = {
  success: boolean;
  message: string;
  payload?: T;
  errors?: E;
};
