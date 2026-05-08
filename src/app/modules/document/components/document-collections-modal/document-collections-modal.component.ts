import { Component } from '@angular/core';
import { DocumentWorkspaceStore } from '../document-workspace/document-workspace.store';

@Component({
  selector: 'app-document-collections-modal',
  standalone: false,
  templateUrl: './document-collections-modal.component.html',
  styleUrls: ['./document-collections-modal.component.scss'],
})
export class DocumentCollectionsModalComponent {
  constructor(public readonly store: DocumentWorkspaceStore) {}
}
