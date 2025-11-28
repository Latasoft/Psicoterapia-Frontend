import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { 
  Blog, 
  BlogListResponse, 
  BlogResponse, 
  CreateBlogDto, 
  UpdateBlogDto,
  BlogQueryOptions,
  BlogSearchResponse,
  BlogStatsResponse
} from '../core/models/blog.model';

/**
 * Servicio para gestión de blogs
 * Arquitectura limpia con tipos TypeScript
 */
@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private readonly apiUrl = `${environment.apiUrl}/api/blogs`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener lista de blogs con paginación
   */
  getBlogs(options: BlogQueryOptions = {}): Observable<BlogListResponse> {
    const params = this.buildQueryParams(options);
    return this.http.get<BlogListResponse>(this.apiUrl, { params });
  }

  /**
   * Obtener un blog por ID
   */
  getBlogById(id: string): Observable<Blog> {
    return this.http.get<BlogResponse>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Crear un nuevo blog (requiere autenticación admin)
   */
  createBlog(blog: CreateBlogDto): Observable<Blog> {
    return this.http.post<BlogResponse>(this.apiUrl, blog).pipe(
      map(response => response.data)
    );
  }

  /**
   * Actualizar un blog (requiere autenticación admin)
   */
  updateBlog(id: string, blog: UpdateBlogDto): Observable<Blog> {
    return this.http.put<BlogResponse>(`${this.apiUrl}/${id}`, blog).pipe(
      map(response => response.data)
    );
  }

  /**
   * Eliminar un blog (requiere autenticación admin)
   */
  deleteBlog(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Buscar blogs por texto
   */
  searchBlogs(searchText: string, options: BlogQueryOptions = {}): Observable<BlogSearchResponse> {
    const params = this.buildQueryParams({ ...options, q: searchText });
    return this.http.get<BlogSearchResponse>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Obtener estadísticas de blogs (requiere autenticación admin)
   */
  getStats(): Observable<BlogStatsResponse> {
    return this.http.get<BlogStatsResponse>(`${this.apiUrl}/admin/stats`);
  }

  /**
   * Construir parámetros de query
   */
  private buildQueryParams(options: any): HttpParams {
    let params = new HttpParams();

    Object.keys(options).forEach(key => {
      if (options[key] !== undefined && options[key] !== null) {
        params = params.set(key, options[key].toString());
      }
    });

    return params;
  }
}

