import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { RegistroComponent } from '../../src/app/components/registro/registro.component'
import { LoginComponent } from '../../src/app/components/login/login.component';
import { MiPerfilComponent } from '../../src/app/components/mi-perfil/mi-perfil.component';
import { adminGuard } from './guards/admin.guard';
import { TurnosGuard } from './guards/turnos.guard';
import { UsuariosComponent } from './components/usuarios/usuarios.component';
import { HistoriaClinicaComponent } from './components/historia-clinica/historia-clinica.component';
import { EstadisticasComponent } from './components/estadisticas/estadisticas.component'



export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'home', component: HomeComponent, data: { animation: 'HomePage' } },
    { path: 'registro', component: RegistroComponent, data: { animation: 'RegisterPage' } },
    { path: 'login', component: LoginComponent, data: { animation: 'LoginPage' } },
    { path: 'mi-perfil', component: MiPerfilComponent },
    { path: 'mi-perfil/:id', component: MiPerfilComponent },
    { path: 'historia-clinica', component: HistoriaClinicaComponent },
    { path: 'historia-clinica/:id', component: HistoriaClinicaComponent },
    { path: 'estadisticas', component: EstadisticasComponent },
    {
        path: 'usuarios',
        component: UsuariosComponent,
        canActivate: [adminGuard]
    },
    {
        path: 'turnos',
        loadChildren: () => import('./turnos/turnos.module').then(m => m.TurnosModule)
    }

];
