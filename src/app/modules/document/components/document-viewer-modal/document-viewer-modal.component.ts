import { Component } from '@angular/core';
import { DocumentWorkspaceStore } from '../document-workspace/document-workspace.store';

@Component({
  selector: 'app-document-viewer-modal',
  standalone: false,
  templateUrl: './document-viewer-modal.component.html',
  styleUrls: ['./document-viewer-modal.component.scss'],
})
export class DocumentViewerModalComponent {
  constructor(public readonly store: DocumentWorkspaceStore) {}
}
