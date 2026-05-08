import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DocumentBrowserModalComponent } from './components/document-browser-modal/document-browser-modal.component';
import { DocumentCollectionSetupComponent } from './components/document-collection-setup/document-collection-setup.component';
import { DocumentCollectionsModalComponent } from './components/document-collections-modal/document-collections-modal.component';
import { DocumentIngestionPanelsComponent } from './components/document-ingestion-panels/document-ingestion-panels.component';
import { DocumentRetrievalSettingsComponent } from './components/document-retrieval-settings/document-retrieval-settings.component';
import { DocumentViewerModalComponent } from './components/document-viewer-modal/document-viewer-modal.component';
import { DocumentWorkspaceComponent } from './components/document-workspace/document-workspace.component';
import { DocumentPageComponent } from './pages/document-page/document-page.component';
import { DocumentRoutingModule } from './document-routing.module';

@NgModule({
  declarations: [
    DocumentBrowserModalComponent,
    DocumentCollectionSetupComponent,
    DocumentCollectionsModalComponent,
    DocumentIngestionPanelsComponent,
    DocumentRetrievalSettingsComponent,
    DocumentViewerModalComponent,
    DocumentWorkspaceComponent,
    DocumentPageComponent,
  ],
  imports: [CommonModule, FormsModule, DocumentRoutingModule],
})
export class DocumentModule {}
