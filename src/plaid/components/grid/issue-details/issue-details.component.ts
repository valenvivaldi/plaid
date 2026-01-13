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
  jiraURL!: string;

  @Input()
  issue!: Issue;

  constructor(
    private electronService: ElectronService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {}

  ngOnChanges() {}

  openIssueInJira(event: MouseEvent, issueKey: string) {
    // Prevenir comportamiento por defecto y propagación del evento
    event.preventDefault();
    event.stopPropagation();
    
    if (this.jiraURL && issueKey) {
      const url = `${this.jiraURL}/browse/${issueKey}`;
      
      // Siempre usar shell.openExternal para abrir en el navegador del sistema
      if (this.electronService?.shell?.openExternal) {
        this.electronService.shell.openExternal(url);
      }
    }
  }

  getComponents(): string {
    return this.issue?.fields?.components?.map(c => c.name).join(', ') || '';
  }
}
