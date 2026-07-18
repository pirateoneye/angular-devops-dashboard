import {Component, Input, signal, ChangeDetectionStrategy} from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  selector: 'omp-skeleton',
  template: `
    <div class="skeleton">
      @for (i of rowArr(); track i) {
        <div class="sk-row"></div>
      }
    </div>
  `,
  styles: [`
    :host { display: contents; }
    .skeleton { padding: 8px 14px 14px; display: flex; flex-direction: column; gap: 6px; }
    .sk-row { height: 12px; background: var(--msv-surface-2); border-radius: 4px; animation: omp-shimmer 1.2s infinite; }
    @keyframes omp-shimmer { 0%{ opacity: .4 } 50%{ opacity: .8 } 100%{ opacity: .4 } }
  `],
})
export class SkeletonComponent {
  @Input() set rows(v: number) { this.rowArr.set(Array.from({ length: v }, (_, i) => i)); }
  readonly rowArr = signal<number[]>([]);
}
