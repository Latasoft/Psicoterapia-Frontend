import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { CreateBlogDto } from '../../core/models/blog.model';
import { RichTextEditorComponent } from '../../shared/components/rich-text-editor/rich-text-editor.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { YoutubeEmbedPipe } from '../../shared/pipes/youtube-embed.pipe';

/**
 * Componente para crear un nuevo blog
 * Usa Reactive Forms con validación
 */
@Component({
  selector: 'app-crear-blog',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule, RichTextEditorComponent, YoutubeEmbedPipe],
  templateUrl: './crear-blog.component.html',
  styleUrls: ['./crear-blog.component.css']
})
export class CrearBlogComponent implements OnInit {
  blogForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  showPreview = false;

  constructor(
    private fb: FormBuilder,
    private blogService: BlogService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  /**
   * Inicializa el formulario con validadores
   */
  private initializeForm(): void {
    this.blogForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      content: ['', [Validators.required, Validators.minLength(10)]],
      imageUrl: [''],
      videoUrl: ['']
    });
  }

  /**
   * Getters para acceso fácil a los controles del formulario
   */
  get title() { return this.blogForm.get('title'); }
  get content() { return this.blogForm.get('content'); }
  get imageUrl() { return this.blogForm.get('imageUrl'); }
  get videoUrl() {
    return this.blogForm.get('videoUrl');
  }

  togglePreview(): void {
    this.showPreview = !this.showPreview;
  }

  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  getPreviewData() {
    return {
      title: this.blogForm.get('title')?.value || 'Sin título',
      content: this.blogForm.get('content')?.value || 'Sin contenido',
      imageUrl: this.blogForm.get('imageUrl')?.value,
      videoUrl: this.blogForm.get('videoUrl')?.value
    };
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (this.blogForm.invalid) {
      this.markFormGroupTouched(this.blogForm);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const blogData: CreateBlogDto = {
      title: this.blogForm.value.title.trim(),
      content: this.blogForm.value.content.trim(),
      imageUrl: this.blogForm.value.imageUrl?.trim() || null,
      videoUrl: this.blogForm.value.videoUrl?.trim() || null
    };

    this.blogService.createBlog(blogData).subscribe({
      next: (blog) => {
        console.log('✅ Blog creado:', blog);
        this.successMessage = '¡Blog creado exitosamente!';
        this.blogForm.reset();
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/admin-blogs']);
        }, 2000);
      },
      error: (error) => {
        console.error('❌ Error al crear blog:', error);
        this.errorMessage = error.message || 'Error al crear el blog';
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  /**
   * Marca todos los campos del formulario como touched para mostrar errores
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Cancela la creación y vuelve atrás
   */
  onCancel(): void {
    this.router.navigate(['/admin-blogs']);
  }
}
