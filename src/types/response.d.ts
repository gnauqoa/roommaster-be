export interface TokenResponse {
  token: string;
  expires: Date;
}

export interface AuthTokensResponse {
  access: TokenResponse;
  refresh?: TokenResponse;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export interface PaginatedResponse<T> {
  results: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
