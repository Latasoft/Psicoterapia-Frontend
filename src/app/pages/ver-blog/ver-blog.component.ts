import { Component, OnInit } from '@angular/core';
import { BlogService } from '../../services/blog.service';
import { CommonModule } from '@angular/common';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-ver-blog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ver-blog.component.html',
  styleUrls: ['./ver-blog.component.css']
})
export class VerBlogComponent implements OnInit {
  blogs: any[] = [];
  blogSeleccionado: any = null;
  errorMessage: string = '';

  constructor(
    private blogService: BlogService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.blogService.obtenerBlogs().pipe(
      catchError(error => {
        this.errorMessage = 'Error al cargar los blogs';
        console.error(error);
        return of([]);
      })
    ).subscribe((data) => {
      this.blogs = data;
    });
  }

  seleccionarBlog(blog: any): void {
    if (blog.fecha && blog.fecha._seconds) {
      blog.fecha = new Date(blog.fecha._seconds * 1000);
    }
    this.blogSeleccionado = blog;
  }

  cerrarDetalle(): void {
    this.blogSeleccionado = null;
  }

  sanitizarUrl(url: string): SafeResourceUrl | null {
    if (!url) return null;
    const videoId = this.extraerVideoId(url);
    if (videoId) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`);
    }
    return null;
  }

  private extraerVideoId(url: string): string | null {
    const regex = /(?:\?v=|\/embed\/|\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }
}
