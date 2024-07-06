import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { SpanTextDirective } from '../../directives/span-text.directive';

@Component({
    selector: 'app-text-layer',
    templateUrl: './text-layer.component.html',
    styleUrls: ['./text-layer.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [SpanTextDirective],
})
export class TextLayerComponent {}
