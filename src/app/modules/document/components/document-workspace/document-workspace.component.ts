import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DocumentWorkspaceStore } from './document-workspace.store';

@Component({
  selector: 'app-document-workspace',
  standalone: false,
  templateUrl: './document-workspace.component.html',
  styleUrls: ['./document-workspace.component.scss'],
  providers: [DocumentWorkspaceStore],
})
export class DocumentWorkspaceComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('statusViewport') private statusViewport?: ElementRef<HTMLElement>;

  constructor(public readonly store: DocumentWorkspaceStore) {}

  ngOnInit(): void {
    this.store.init();
  }

  ngAfterViewInit(): void {
    this.store.setStatusViewport(this.statusViewport);
  }

  ngOnDestroy(): void {
    this.store.destroy();
  }
}
