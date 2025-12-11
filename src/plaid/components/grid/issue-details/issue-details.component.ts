import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, OnChanges} from '@angular/core';
import {Issue} from '../../../model/issue';
import {ElectronService} from '../../../core/electron/electron.service';

/**
 * Dumb component presenting the details of an issue for the worklog panel and issue selector.
 */
@Component({
  selector: 'plaid-issue-details',
  templateUrl: './issue-details.component.html',
  styleUrls: ['./issue-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IssueDetailsComponent implements OnInit, OnChanges {
  @Input()
  jiraURL: string;

  @Input()
  issue: Issue;

  // Variables para el menú contextual
  contextMenuVisible = false;
  contextMenuX = 0;
  contextMenuY = 0;
  selectedIssueKey: string;

  constructor(
    private electronService: ElectronService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('===== IssueDetailsComponent: INICIALIZACIÓN =====');
    console.log('IssueDetailsComponent: jiraURL recibido:', this.jiraURL);
    console.log('IssueDetailsComponent: issue recibida:', this.issue?.key);
    console.log('===== FIN INICIALIZACIÓN ISSUE DETAILS =====');
  }

  ngOnChanges() {
    console.log('===== IssueDetailsComponent: CAMBIOS DETECTADOS =====');
    console.log('IssueDetailsComponent: jiraURL actual:', this.jiraURL);
    console.log('IssueDetailsComponent: issue actual:', this.issue?.key);
    if (this.jiraURL && this.issue?.key) {
      const fullUrl = `${this.jiraURL}/browse/${this.issue.key}`;
      console.log('IssueDetailsComponent: URL completa que se debería generar:', fullUrl);
    }
    console.log('===== FIN CAMBIOS ISSUE DETAILS =====');
  }

  showContextMenu(event: MouseEvent, issueKey: string) {
    event.preventDefault();
    event.stopPropagation();
    
    alert(`🔍 MENÚ CONTEXTUAL: Mostrando para ${issueKey}, jiraURL: ${this.jiraURL}`);
    
    if (!this.jiraURL) {
      alert('⚠️ No hay jiraURL disponible, no se puede abrir el menú');
      return;
    }

    this.selectedIssueKey = issueKey;
    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;
    this.contextMenuVisible = true;
    
    // Forzar detección de cambios
    this.cdr.detectChanges();
  }

  hideContextMenu() {
    this.contextMenuVisible = false;
    this.cdr.detectChanges();
  }

  openInJira() {
    alert(`🚀 ABRIENDO EN JIRA: ${this.jiraURL}/browse/${this.selectedIssueKey}`);
    
    if (this.jiraURL && this.selectedIssueKey) {
      const url = `${this.jiraURL}/browse/${this.selectedIssueKey}`;
      
      try {
        // Verificar si el electronService y shell están disponibles
        if (this.electronService && this.electronService.shell && this.electronService.shell.openExternal) {
          this.electronService.shell.openExternal(url);
          alert('✅ Comando openExternal ejecutado (método shell)');
        } else if (this.electronService && this.electronService.isElectron) {
          // Alternativa: usar window.require directamente
          const { shell } = window.require('electron');
          shell.openExternal(url);
          alert('✅ Comando openExternal ejecutado (método directo)');
        } else {
          // Fallback: abrir en el mismo proceso (no debería pasar en Electron)
          window.open(url, '_blank');
          alert('⚠️ Usado fallback window.open (no es Electron)');
        }
      } catch (error) {
        alert(`❌ Error: ${error}`);
      }
    } else {
      alert(`⚠️ No se puede abrir: jiraURL=${this.jiraURL}, issueKey=${this.selectedIssueKey}`);
    }
    
    this.hideContextMenu();
  }

  getComponents(): string {
    return this.issue?.fields?.components?.map(c => c.name).join(', ') || '';
  }
}
