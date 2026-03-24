import { Component } from '@angular/core';
import { ModulePageConfig } from '../../../../shared/components/module-page/module-page.component';

@Component({
  selector: 'app-document-page',
  standalone: false,
  template: '<app-module-page [config]="config"></app-module-page>'
})
export class DocumentPageComponent {
  readonly config: ModulePageConfig = {
    name: 'document',
    subtitle: 'The area focused on document upload, parsing, indexing, and using files as AI context.',
    purpose: 'This page usually exists when the application accepts PDFs, DOCX files, text files, or knowledge-base content and prepares them for search or question answering.',
    sections: [
      {
        title: 'Main idea',
        text: 'Documents are imported, processed, and turned into structured content that the rest of the system can use.'
      },
      {
        title: 'Typical flow',
        text: 'Upload a file, extract text, split content into chunks, then associate those chunks with metadata.'
      },
      {
        title: 'User value',
        text: 'Documents make the chatbot or search engine answer based on real internal content instead of only general model knowledge.'
      }
    ],
    actions: [
      { label: 'Upload zone', description: 'Add a clear file-upload component for importing source material.' },
      { label: 'Processing status', description: 'Show whether a document is queued, parsed, indexed, or failed.' },
      { label: 'Document list', description: 'Let users browse uploaded files and inspect basic metadata.' }
    ]
  };
}
