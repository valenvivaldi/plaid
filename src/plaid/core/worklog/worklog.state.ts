import {Injectable} from '@angular/core';
import {Worklog} from '../../models/worklog';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WorklogState {
  private fetching = new BehaviorSubject<boolean>(false);
  private worklogs = new BehaviorSubject<Worklog[]>(null);

  getFetching$(): Observable<boolean> {
    return this.fetching.asObservable();
  }

  setFetching(fetching: boolean) {
    this.fetching.next(fetching);
  }

  getWorklogs$(): Observable<Worklog[]> {
    return this.worklogs.asObservable();
  }

  setWorklogs(worklogs: Worklog[]) {
    this.worklogs.next(worklogs);
  }
}
