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
import { MenuAdminComponent } from './pages/menu-admin/menu-admin.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminBlogComponent } from './pages/admin-blog/admin-blog.component';
import { CrearTallerComponent } from './pages/crear-taller/crear-taller.component';
import { AdminTallerComponent } from './pages/admin-taller/admin-taller.component';
import { HorarioComponent } from './pages/horario/horario.component';
import { TratamientosComponent } from './pages/tratamientos/tratamientos.component';



export const routes: Routes = [
    { path: '', component: InicioComponent },
    { path: 'tarotista', component: TarotistaComponent },
    { path: 'formulario', component: FormularioComponent},
    {
        path: 'admin-citas',
        component: AdminCitasComponent,canActivate: [AuthGuard]
      },{ path: 'sobremi', component: SobremiComponent },
      { path: 'crear-blog', component: CrearBlogComponent,canActivate: [AuthGuard] },
      { path: 'ver-blog', component: VerBlogComponent},
      { path: 'taller', component: TallerComponent },
      { path: 'pago-klap', component: PagoKlapComponent },
      { path: 'login', component: LoginComponent},
      { path: 'menu-admin', component: MenuAdminComponent,canActivate: [AuthGuard] },
      {
        path: 'blog/:id',
        component: VerBlogComponent
      },
      { path: 'admin-blogs', component: AdminBlogComponent,canActivate: [AuthGuard] },
      { path: 'crear-taller', component: CrearTallerComponent,canActivate: [AuthGuard]},
      { path: 'admin-taller', component: AdminTallerComponent,canActivate: [AuthGuard] },
      { path: 'horario', component: HorarioComponent,canActivate: [AuthGuard] },
      {
  path: 'tratamientos',
  component: TratamientosComponent
}

      
      

      
      
      
   
];
@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
  })
  export class AppRoutingModule { }