export type ApiResponse<T> = {
  status: boolean;
  message: string;
  data?: T;
};

export type PaginatedResponse<T> = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: T[];
};
