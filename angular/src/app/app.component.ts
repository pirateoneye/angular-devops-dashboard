import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from './shared/service/user-service/user.service';
import { ThemeService } from './core/service/theme.service';
import { ToolCatalogService } from './core/service/tool-catalog.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly userService = inject(UserService);
  private readonly catalog = inject(ToolCatalogService);
  readonly theme = inject(ThemeService);

  /** Current username, exposed as a signal so OnPush tracks changes. */
  readonly user = toSignal(this.userService.user, { initialValue: '-' });

  /** Mobile nav panel open state (desktop nav is always inline). */
  readonly menuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  ngOnInit() {
    this.theme.init();

    const userLocalStorage = localStorage.getItem('user');
    if (userLocalStorage) {
      this.userService.setNama(userLocalStorage);
    } else {
      this.editUsername();
    }
  }

  async editUsername(): Promise<void> {
    const { ModalInsertNameComponent } =
      await import('./shared/component/modal/insert-name/modal-insert-name.component');
    this.dialog.open(ModalInsertNameComponent, {
      disableClose: true,
      panelClass: 'custom-modalbox',
    });
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  async openPalette(): Promise<void> {
    // Guard against stacking multiple palettes when Ctrl+K is pressed again.
    if (this.dialog.getDialogById('palette')) {
      return;
    }
    const { CommandPaletteComponent } =
      await import('./shared/component/command-palette/command-palette.component');
    this.dialog.open(CommandPaletteComponent, {
      id: 'palette',
      panelClass: 'msv-command-palette',
      autoFocus: true,
      data: { favorites: this.catalog.favorites() },
    });
  }

  @HostListener('window:keydown', ['$event'])
  onShortcut(event: KeyboardEvent): void {
    // Use event.code to ignore Shift/CapsLock state of the produced character.
    if ((event.ctrlKey || event.metaKey) && event.code === 'KeyK') {
      event.preventDefault();
      this.openPalette();
    } else if (event.key === 'Escape' && this.menuOpen()) {
      this.closeMenu();
    }
  }
}
