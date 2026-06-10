import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {UserPreferencesService} from './user-preferences.service';
import {ElectronService} from './electron/electron.service';

@Injectable({ providedIn: 'root' })
export class SystemPreferencesService {
  private darkModeSubject = new BehaviorSubject<boolean>(false);

  constructor(private userPreferencesService: UserPreferencesService, private electronService: ElectronService) {
    // `nativeTheme` is a main-process-only module since Electron 12+, so it is not
    // available via `require('electron')` in the renderer. Guard against it being
    // undefined and fall back to matchMedia, which reflects the OS/Electron theme.
    const nativeTheme = this.electronService.isElectron
      ? (window as any).require('electron').nativeTheme
      : undefined;

    if (nativeTheme) {
      this.darkModeSubject.next(nativeTheme.shouldUseDarkColors);

      nativeTheme.removeAllListeners('updated');
      nativeTheme.addListener('updated', () => {
        this.darkModeSubject.next(nativeTheme.shouldUseDarkColors);
      });

      userPreferencesService.getTheme$().subscribe(theme => {
        nativeTheme.themeSource = theme;
      });
    } else if (window.matchMedia) {
      // Fallback para cuando nativeTheme no está disponible (renderer) o fuera de Electron.
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.darkModeSubject.next(mediaQuery.matches);

      mediaQuery.addEventListener('change', (e) => {
        this.darkModeSubject.next(e.matches);
      });
    }
  }

  getDarkMode$(): Observable<boolean> {
    return this.darkModeSubject.asObservable();
  }
}
