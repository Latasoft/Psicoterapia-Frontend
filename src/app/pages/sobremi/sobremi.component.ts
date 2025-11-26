import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { lastValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { PageContentService } from '../../services/page-content.service';

@Component({
  selector: 'app-sobremi',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sobremi.component.html',
  styleUrl: './sobremi.component.css'
})
export class SobremiComponent implements OnInit, OnDestroy {
  // Admin properties
  isLoggedIn = false;
  adminMode = false;

  // Content properties
  aboutContent = {
    title: 'Sobre mí',
    description: '22 años de experiencia profesional en el área clínica, educacional y en relatorías avalan mi trabajo. Especialista en Hipnoterapia para trabajar estados depresivos, ansiosos, de angustia, duelos y crisis vitales.'
  };

  cards = [
    {
      title: 'Confidencialidad',
      description: 'Todo lo compartido en las sesiones se mantiene en total confidencialidad, garantizando un espacio seguro para tu desarrollo personal.'
    },
    {
      title: 'Profesionalismo',
      description: 'Cuento con la formación y experiencia necesarias para ofrecer un servicio de calidad, basado en el respeto y la ética profesional.'
    },
    {
      title: 'Responsabilidad',
      description: 'Me comprometo a ofrecerte la mejor atención, siguiendo los estándares más altos de profesionalismo y dedicación.'
    }
  ];

  // Debounce timeout
  private saveTimeout: any;

  constructor(
    private authService: AuthService,
    private pageContentService: PageContentService
  ) {}

  ngOnInit() {
    this.initializeComponent();
  }

  ngOnDestroy() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
  }

  private async initializeComponent() {
    const loggedIn = this.authService.isLoggedIn();
    this.isLoggedIn = loggedIn;
    
    if (loggedIn) {
      await this.loadPageContent();
    }
  }

  // ========== ADMIN FUNCTIONS ==========
  toggleAdminMode() {
    this.adminMode = !this.adminMode;
  }

  onTextChange(event: any, field: string) {
    if (!this.adminMode) return;
    
    if (field === 'description') {
      this.aboutContent.description = event.target.innerText;
    } else if (field === 'title') {
      this.aboutContent.title = event.target.innerText;
    }
    
    this.onContentChange();
  }

  private onContentChange() {
    if (!this.adminMode) return;
    
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(() => {
      this.saveContentChanges();
    }, 1000);
  }

  private async saveContentChanges() {
    if (!this.adminMode) return;

    const content = {
      aboutContent: this.aboutContent,
      cards: this.cards
    };

    try {
      await lastValueFrom(
        this.pageContentService.updatePageContent('sobremi', content)
      );
      console.log('Contenido actualizado exitosamente');
    } catch (err) {
      console.error('Error al actualizar contenido:', err);
    }
  }

  private async loadPageContent() {
    try {
      // Cargar contenido desde el servicio
      const content = await lastValueFrom(this.pageContentService.getPageContent('sobremi'));
      if (content) {
        this.aboutContent = content.aboutContent || this.aboutContent;
        this.cards = content.cards || this.cards;
      }
    } catch (error) {
      console.error('Error al cargar contenido:', error);
    }
  }
}
