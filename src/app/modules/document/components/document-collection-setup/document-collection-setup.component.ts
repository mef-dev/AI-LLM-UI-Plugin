import { Component } from '@angular/core';
import { DocumentWorkspaceStore } from '../document-workspace/document-workspace.store';

@Component({
  selector: 'app-document-collection-setup',
  standalone: false,
  templateUrl: './document-collection-setup.component.html',
  styleUrls: ['./document-collection-setup.component.scss'],
})
export class DocumentCollectionSetupComponent {
  constructor(public readonly store: DocumentWorkspaceStore) {}
}
