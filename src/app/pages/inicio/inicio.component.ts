import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';  // Si usas enrutamiento, importa RouterModule
import { FormsModule } from '@angular/forms';
import { BlogService } from '../../services/blog.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
    selector: 'app-inicio', // Marca como componente independiente
    imports: [RouterModule, FormsModule,CommonModule], // Si usas enrutamiento, incluye RouterModule
    templateUrl: './inicio.component.html',
    styleUrls: ['./inicio.component.css']
})
export class InicioComponent {
  ultimosBlogs: any[] = [];
  errorMessage = '';

  constructor(private blogService: BlogService,private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.blogService.obtenerBlogs().pipe(
      catchError(error => {
        this.errorMessage = 'Error al cargar los blogs';
        console.error(error);
        return of([]);
      })
    ).subscribe((data) => {
      this.ultimosBlogs = data
        .sort((a: any, b: any) => b.fecha._seconds - a.fecha._seconds)
        .slice(0, 4); // últimos 4 blogs
    });
  }
   sanitizarUrl(url: string): SafeResourceUrl {
    const videoId = this.obtenerIdYoutube(url);
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  obtenerIdYoutube(url: string): string | null {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }
}
