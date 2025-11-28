import { Component, OnInit } from '@angular/core';
import { BlogService } from '../../services/blog.service';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Blog, PaginationMeta } from '../../core/models/blog.model';
import { YoutubeEmbedPipe } from '../../shared/pipes/youtube-embed.pipe';

@Component({
  selector: 'app-ver-blog',
  standalone: true,
  imports: [CommonModule, YoutubeEmbedPipe],
  templateUrl: './ver-blog.component.html',
  styleUrls: ['./ver-blog.component.css']
})
export class VerBlogComponent implements OnInit {
  blogs: Blog[] = [];
  blogSeleccionado: Blog | null = null;
  
  // Pagination
  currentPage = 1;
  pageSize = 9; // 9 blogs per page for better grid layout
  pagination: PaginationMeta | null = null;

  // State
  isLoading = false;
  errorMessage = '';

  constructor(
    private blogService: BlogService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadBlogs();
  }

  loadBlogs(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.blogService.getBlogs({
      page: this.currentPage,
      limit: this.pageSize,
      sortBy: 'created_at',
      sortOrder: 'desc'
    }).subscribe({
      next: (response) => {
        this.blogs = response.data;
        this.pagination = response.pagination;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Error al cargar los blogs';
        this.isLoading = false;
      }
    });
  }

  selectBlog(blog: Blog): void {
    this.blogSeleccionado = blog;
  }

  closeDetail(): void {
    this.blogSeleccionado = null;
  }

  goToPage(page: number): void {
    if (page < 1 || (this.pagination && page > this.pagination.totalPages)) {
      return;
    }
    this.currentPage = page;
    this.loadBlogs();
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  nextPage(): void {
    if (this.pagination && this.currentPage < this.pagination.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  get totalPages(): number {
    return this.pagination?.totalPages || 0;
  }

  // Helper for content excerpt - strips HTML tags
  getExcerpt(content: string, maxLength: number = 150): string {
    if (!content) return '';
    // Strip HTML tags for preview
    const plainText = content.replace(/<[^>]*>/g, '');
    if (plainText.length <= maxLength) {
      return plainText;
    }
    return plainText.substring(0, maxLength).trim() + '...';
  }

  // Sanitize HTML content for safe rendering
  getSafeHtml(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }
}
