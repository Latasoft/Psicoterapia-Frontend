import { Component } from '@angular/core';
import { BlogService } from '../../services/blog.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-crear-blog',
  imports: [FormsModule, ReactiveFormsModule, CommonModule,RouterModule],
  templateUrl: './crear-blog.component.html',
  styleUrls: ['./crear-blog.component.css']
})
export class CrearBlogComponent {
  titulo = '';
  texto = '';
  imagen = '';
  videoUrl = '';
  mensajeExito = '';

  constructor(private blogService: BlogService) {}

  crearBlog(): void {
    if (this.titulo && this.texto) {
      const urlEmbed = this.convertirUrlYoutube(this.videoUrl);
      if (this.videoUrl && !urlEmbed) {
        alert('La URL del video no es válida');
        return;
      }

      this.blogService.crearBlog(this.titulo, this.texto, this.imagen, urlEmbed).subscribe(
        (response: any) => {
          console.log('Blog creado exitosamente', response);
          this.mensajeExito = '✅ ¡Tu blog ha sido creado exitosamente!';
          this.titulo = '';
          this.texto = '';
          this.imagen = '';
          this.videoUrl = '';

          setTimeout(() => {
            this.mensajeExito = '';
          }, 3000);
        },
        (error: any) => {
          console.error('Error al crear el blog', error);
        }
      );
    } else {
      alert('Por favor, complete el título y el texto');
    }
  }

  convertirUrlYoutube(url: string): string {
    if (!url) return '';

    let videoId = '';

    // Detecta shorts
    const shortMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
    if (shortMatch && shortMatch[1]) {
      videoId = shortMatch[1];
    } else {
      // Detecta URLs normales con v=...
      const normalMatch = url.match(/v=([a-zA-Z0-9_-]+)/);
      if (normalMatch && normalMatch[1]) {
        videoId = normalMatch[1];
      } else {
        // Detecta URLs cortas youtu.be/...
        const shortUrlMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
        if (shortUrlMatch && shortUrlMatch[1]) {
          videoId = shortUrlMatch[1];
        }
      }
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }

    return ''; // URL no válida
  }
}
