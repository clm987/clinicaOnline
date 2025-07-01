import { trigger, transition, query, style, animate, group } from '@angular/animations';

export const routeAnimations = trigger('routeAnimations', [
    transition('HomePage => LoginPage', [
        query(':enter, :leave', style({ position: 'fixed', width: '100%' }), { optional: true }),
        query(':enter', style({ transform: 'translateY(-100%)' }), { optional: true }),
        group([
            query(':leave', animate('500ms ease-out', style({ opacity: 0 })), { optional: true }),
            query(':enter', animate('500ms ease-out', style({ transform: 'translateY(0%)' })), { optional: true })
        ])
    ]),
    transition('HomePage => RegisterPage', [
        query(':enter, :leave', style({ position: 'fixed', width: '100%' }), { optional: true }),
        query(':enter', style({ transform: 'translateX(100%)' }), { optional: true }),
        group([
            query(':leave', animate('300ms ease-out', style({ opacity: 0 })), { optional: true }),
            query(':enter', animate('300ms ease-out', style({ transform: 'translateX(0)' })), { optional: true })
        ])
    ])
]);
