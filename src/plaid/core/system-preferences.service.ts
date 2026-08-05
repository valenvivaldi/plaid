import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {UserPreferencesService} from './user-preferences.service';
import {ElectronService} from './electron/electron.service';

@Injectable({ providedIn: 'root' })
export class SystemPreferencesService {
  private darkModeSubject = new BehaviorSubject<boolean>(false);

  constructor(private userPreferencesService: UserPreferencesService, private electronService: ElectronService) {
    if (this.electronService.isElectron) {
      this.darkModeSubject.next(this.electronService.getSystemDarkMode());
      this.electronService.onSystemThemeUpdated(darkMode => this.darkModeSubject.next(darkMode));
      userPreferencesService.getTheme$().subscribe(theme => {
        this.electronService.setThemeSource(theme);
      });
    } else {
      // Fallback para cuando no está en Electron - detectar preferencia del sistema
      if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.darkModeSubject.next(mediaQuery.matches);
        
        mediaQuery.addEventListener('change', (e) => {
          this.darkModeSubject.next(e.matches);
        });
      }
    }
  }

  getDarkMode$(): Observable<boolean> {
    return this.darkModeSubject.asObservable();
  }
}
