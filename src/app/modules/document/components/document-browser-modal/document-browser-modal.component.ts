import { Component } from '@angular/core';
import { DocumentWorkspaceStore } from '../document-workspace/document-workspace.store';

@Component({
  selector: 'app-document-browser-modal',
  standalone: false,
  templateUrl: './document-browser-modal.component.html',
  styleUrls: ['./document-browser-modal.component.scss'],
})
export class DocumentBrowserModalComponent {
  constructor(public readonly store: DocumentWorkspaceStore) {}
}
