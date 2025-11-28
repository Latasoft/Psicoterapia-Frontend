import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/**
 * Pipe para convertir URLs de YouTube a formato embed
 * Soporta: youtube.com/watch, youtu.be, youtube.com/shorts, youtube.com/embed
 * 
 * Uso: {{ videoUrl | youtubeEmbed }}
 */
@Pipe({
  name: 'youtubeEmbed',
  standalone: true
})
export class YoutubeEmbedPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(url: string | null): SafeResourceUrl | null {
    if (!url) {
      return null;
    }

    // Si ya es una URL embed, sanitizarla directamente
    if (url.includes('/embed/')) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    // Extraer video ID de diferentes formatos
    const videoId = this.extractVideoId(url);
    
    if (!videoId) {
      return null;
    }

    // Crear URL embed
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  /**
   * Extrae el ID de video de diferentes formatos de URL de YouTube
   */
  private extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,      // youtube.com/watch?v=ID
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,        // youtube.com/embed/ID
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,                  // youtu.be/ID
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/        // youtube.com/shorts/ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }
}
