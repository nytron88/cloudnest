export type PaginationMeta = {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};
