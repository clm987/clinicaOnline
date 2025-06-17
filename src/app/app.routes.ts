import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { RegistroComponent } from '../../src/app/components/registro/registro.component'
import { LoginComponent } from '../../src/app/components/login/login.component';
import { adminGuard } from './guards/admin.guard';
import { UsuariosComponent } from './components/usuarios/usuarios.component';


export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'home', component: HomeComponent },
    { path: 'registro', component: RegistroComponent },
    { path: 'login', component: LoginComponent },
    {
        path: 'usuarios',
        component: UsuariosComponent,
        canActivate: [adminGuard]
    }


];
