import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { routeAnimations } from './animaciones/route-animations';



@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  animations: [routeAnimations]
})
export class AppComponent {
  title = 'clinicaOnline';
  getAnimationData(outlet: RouterOutlet) {
    return outlet.activatedRouteData['animation'];
  }


}
