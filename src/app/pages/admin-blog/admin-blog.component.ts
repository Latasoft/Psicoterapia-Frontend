import { Component, OnInit } from '@angular/core';
import { BlogService } from '../../services/blog.service';
import { ToastService } from '../../services/toast.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Blog, UpdateBlogDto, PaginationMeta } from '../../core/models/blog.model';
import { YoutubeEmbedPipe } from '../../shared/pipes/youtube-embed.pipe';
import { RichTextEditorComponent } from '../../shared/components/rich-text-editor/rich-text-editor.component';
import { ToastContainerComponent } from '../../components/toast-container/toast-container.component';

@Component({
  selector: 'app-admin-blog',
  imports: [ReactiveFormsModule, CommonModule, RouterModule, YoutubeEmbedPipe, RichTextEditorComponent, ToastContainerComponent],
  templateUrl: './admin-blog.component.html',
  styleUrls: ['./admin-blog.component.css'],
  standalone: true
})
export class AdminBlogComponent implements OnInit {
  blogs: Blog[] = [];
  blogEditando: Blog | null = null;
  editForm: FormGroup | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  pagination: PaginationMeta | null = null;

  // State
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  isDeleting: string | null = null; // ID del blog que se está eliminando
  expandedBlogs = new Map<string, boolean>(); // Track which blogs are expanded

  constructor(
    private blogService: BlogService,
    private formBuilder: FormBuilder,
    private sanitizer: DomSanitizer,
    private toastService: ToastService
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

  deleteBlog(id: string): void {
    if (!confirm('¿Estás seguro de que deseas eliminar este blog?')) {
      return;
    }

    this.isDeleting = id;
    this.errorMessage = '';

    this.blogService.deleteBlog(id).subscribe({
      next: () => {
        this.toastService.success('Blog eliminado correctamente');
        this.isDeleting = null;
        this.loadBlogs();
      },
      error: (error) => {
        this.toastService.error(error.message || 'Error al eliminar el blog');
        this.isDeleting = null;
      }
    });
  }

  startEdit(blog: Blog): void {
    this.blogEditando = { ...blog };
    this.editForm = this.formBuilder.group({
      title: [blog.title, [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      content: [blog.content, [Validators.required, Validators.minLength(10)]],
      imageUrl: [blog.imageUrl || ''],
      videoUrl: [blog.videoUrl || '']
    });
  }

  saveChanges(): void {
    if (!this.editForm || !this.blogEditando || this.editForm.invalid) {
      return;
    }

    this.errorMessage = '';
    const updateDto: UpdateBlogDto = this.editForm.value;

    this.blogService.updateBlog(this.blogEditando.id, updateDto).subscribe({
      next: () => {
        this.toastService.success('Blog actualizado exitosamente');
        this.cancelEdit();
        this.loadBlogs();
      },
      error: (error) => {
        this.toastService.error(error.message || 'Error al actualizar el blog');
      }
    });
  }

  cancelEdit(): void {
    this.blogEditando = null;
    this.editForm = null;
  }

  goToPage(page: number): void {
    if (page < 1 || (this.pagination && page > this.pagination.totalPages)) {
      return;
    }
    this.currentPage = page;
    this.loadBlogs();
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

  get title() {
    return this.editForm?.get('title');
  }

  get content() {
    return this.editForm?.get('content');
  }

  get imageUrl() {
    return this.editForm?.get('imageUrl');
  }

  get videoUrl() {
    return this.editForm?.get('videoUrl');
  }

  // Sanitize HTML content for safe rendering
  getSafeHtml(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

  // Get preview of content (first 200 characters)
  getContentPreview(content: string): string {
    const plainText = content.replace(/<[^>]*>/g, ''); // Strip HTML tags
    return plainText.length > 200 ? plainText.substring(0, 200) + '...' : plainText;
  }

  // Toggle expand/collapse for blog content
  toggleExpand(blogId: string): void {
    this.expandedBlogs.set(blogId, !this.expandedBlogs.get(blogId));
  }

  // Check if blog is expanded
  isExpanded(blogId: string): boolean {
    return this.expandedBlogs.get(blogId) || false;
  }
}
