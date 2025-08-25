import { Component, OnInit } from '@angular/core';
import { BlogService } from '../../services/blog.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-blog',
  imports: [FormsModule, CommonModule,RouterModule],
  templateUrl: './admin-blog.component.html',
  styleUrls: ['./admin-blog.component.css']
})
export class AdminBlogComponent implements OnInit {
  blogs: any[] = [];
  blogEditando: any = null;

  mensaje = '';

  constructor(
    private blogService: BlogService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.obtenerBlogs();
  }

  obtenerBlogs(): void {
    this.blogService.obtenerBlogs().subscribe((data: any[]) => {
      this.blogs = data;
    });
  }

  eliminarBlog(id: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar este blog?')) {
      this.blogService.eliminarBlog(id).subscribe(() => {
        this.mensaje = 'Blog eliminado correctamente 🗑️';
        this.obtenerBlogs();
        setTimeout(() => (this.mensaje = ''), 3000);
      });
    }
  }

  editarBlog(blog: any): void {
    // Clona el blog para editarlo sin afectar la lista original directamente
    this.blogEditando = { ...blog };
  }

  guardarCambios(): void {
    // Convertir a embed si hay videoUrl
    if (this.blogEditando.videoUrl) {
      const videoId = this.extraerVideoId(this.blogEditando.videoUrl);
      if (videoId) {
        this.blogEditando.videoUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    }

    this.blogService
      .editarBlog(this.blogEditando.id, this.blogEditando)
      .subscribe(() => {
        this.mensaje = 'Blog actualizado exitosamente ✏️';
        this.blogEditando = null;
        this.obtenerBlogs();
        setTimeout(() => (this.mensaje = ''), 3000);
      });
  }

  cancelarEdicion(): void {
    this.blogEditando = null;
  }

  getVideoEmbedUrl(url: string): SafeResourceUrl | null {
    if (!url) return null;

    const videoId = this.extraerVideoId(url);
    if (videoId) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube.com/embed/${videoId}`
      );
    }

    return null;
  }

  private extraerVideoId(url: string): string | null {
    const regex = /(?:\?v=|\/embed\/|\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }
}
