import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ASCIIClass } from '../../declarations/classes/ascii.class';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPageComponent implements AfterViewInit {
  @ViewChild('outputRef', { static: true }) private readonly outputRef!: ElementRef<HTMLElement>;

  public ngAfterViewInit(): void {
    this.init();
  }

  private init(): void {
    const outputElement: HTMLElement = this.outputRef.nativeElement;
    new ASCIIClass(outputElement);
  }
}
