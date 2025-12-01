import { NgModule } from '@angular/core';
import { Routes } from '@angular/router';
import { InicioComponent } from './pages/inicio/inicio.component';
import { RouterModule} from '@angular/router';
import { TarotistaComponent } from './pages/tarotista/tarotista.component';
import { FormularioComponent } from './pages/formulario/formulario.component';
import { AdminCitasComponent } from './pages/admin-citas/admin-citas.component';
import { SobremiComponent } from './pages/sobremi/sobremi.component';
import { CrearBlogComponent } from './pages/crear-blog/crear-blog.component';
import { VerBlogComponent } from './pages/ver-blog/ver-blog.component';
import { TallerComponent } from './pages/taller/taller.component';
import { PagoKlapComponent } from './pago-klap/pago-klap.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { MenuAdminComponent } from './pages/menu-admin/menu-admin.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { AdminBlogComponent } from './pages/admin-blog/admin-blog.component';
import { CrearTallerComponent } from './pages/crear-taller/crear-taller.component';
import { AdminTallerComponent } from './pages/admin-taller/admin-taller.component';
import { AdminComentariosComponent } from './pages/admin-comentarios/admin-comentarios.component';
import { AdminHorariosComponent } from './pages/admin-horarios/admin-horarios.component';
import { HorarioComponent } from './pages/horario/horario.component';
import { TratamientosComponent } from './pages/tratamientos/tratamientos.component';
import { WebpayReturnComponent } from './components/webpay-return/webpay-return.component';
import { MisCitasComponent } from './pages/mis-citas/mis-citas.component';



export const routes: Routes = [
    { path: '', component: InicioComponent },
    { path: 'tarotista', component: TarotistaComponent },
    { path: 'formulario', component: FormularioComponent },
    { path: 'register', component: RegisterComponent },
    { 
      path: 'mis-citas', 
      component: MisCitasComponent,
      canActivate: [AuthGuard]
    },
    {
      path: 'admin-horarios',
      component: AdminHorariosComponent,
      canActivate: [RoleGuard],
      data: { roles: ['admin'] }
    },
    {
        path: 'admin-citas',
        component: AdminCitasComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      },
      { path: 'sobremi', component: SobremiComponent },
      { 
        path: 'crear-blog', 
        component: CrearBlogComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      },
      { path: 'ver-blog', component: VerBlogComponent},
      { path: 'taller', component: TallerComponent },
      { path: 'pago-klap', component: PagoKlapComponent },
      { path: 'login', component: LoginComponent},
      { 
        path: 'menu-admin', 
        component: MenuAdminComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      },
      {
        path: 'blog/:id',
        component: VerBlogComponent
      },
      { 
        path: 'admin-blogs', 
        component: AdminBlogComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      },
      { 
        path: 'crear-taller', 
        component: CrearTallerComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      },
      { 
        path: 'admin-taller', 
        component: AdminTallerComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      },
      { 
        path: 'admin-comentarios', 
        component: AdminComentariosComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      },
      {
        path: 'tratamientos',
        component: TratamientosComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      },
      { 
        path: 'webpay-return',
        component: WebpayReturnComponent
      },

      
      

      
      
      
   
];
@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
  })
  export class AppRoutingModule { }