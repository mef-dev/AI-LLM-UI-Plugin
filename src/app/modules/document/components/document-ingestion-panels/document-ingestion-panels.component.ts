import { Component } from '@angular/core';
import { DocumentWorkspaceStore } from '../document-workspace/document-workspace.store';

@Component({
  selector: 'app-document-ingestion-panels',
  standalone: false,
  templateUrl: './document-ingestion-panels.component.html',
  styleUrls: ['./document-ingestion-panels.component.scss'],
})
export class DocumentIngestionPanelsComponent {
  constructor(public readonly store: DocumentWorkspaceStore) {}
}
