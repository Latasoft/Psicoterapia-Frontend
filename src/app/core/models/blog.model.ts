/**
 * Modelo de Blog
 * Representa un blog en el sistema
 */
export interface Blog {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  creator?: BlogCreator;
}

/**
 * Información del creador del blog
 */
export interface BlogCreator {
  id: string;
  username: string;
  email: string;
}

/**
 * DTO para crear un blog
 */
export interface CreateBlogDto {
  title: string;
  content: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
}

/**
 * DTO para actualizar un blog
 */
export interface UpdateBlogDto {
  title?: string;
  content?: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
}

/**
 * Respuesta de la API con paginación
 */
export interface BlogListResponse {
  success: boolean;
  data: Blog[];
  pagination: PaginationMeta;
}

/**
 * Respuesta de la API para un blog individual
 */
export interface BlogResponse {
  success: boolean;
  data: Blog;
}

/**
 * Metadata de paginación
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Opciones de consulta para blogs
 */
export interface BlogQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'updated_at' | 'title';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Respuesta de búsqueda
 */
export interface BlogSearchResponse {
  success: boolean;
  data: Blog[];
  pagination: PaginationMeta;
  searchText: string;
}

/**
 * Estadísticas de blogs
 */
export interface BlogStats {
  total: number;
  timestamp: string;
}

/**
 * Respuesta de estadísticas
 */
export interface BlogStatsResponse {
  success: boolean;
  data: BlogStats;
}
