import { Component } from '@angular/core';
import { DocumentWorkspaceStore } from '../document-workspace/document-workspace.store';

@Component({
  selector: 'app-document-retrieval-settings',
  standalone: false,
  templateUrl: './document-retrieval-settings.component.html',
  styleUrls: ['./document-retrieval-settings.component.scss'],
})
export class DocumentRetrievalSettingsComponent {
  constructor(public readonly store: DocumentWorkspaceStore) {}
}
