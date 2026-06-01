import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmbeddingsWorkspaceComponent } from './components/embeddings-workspace/embeddings-workspace.component';
import { EmbeddingsPageComponent } from './pages/embeddings-page/embeddings-page.component';
import { EmbeddingsRoutingModule } from './embeddings-routing.module';

@NgModule({
  declarations: [EmbeddingsWorkspaceComponent, EmbeddingsPageComponent],
  imports: [CommonModule, FormsModule, EmbeddingsRoutingModule],
})
export class EmbeddingsModule {}
