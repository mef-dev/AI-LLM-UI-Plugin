import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlatformHelper } from '@natec/mef-dev-platform-connector';
import { ChatPageComponent } from './chat-page.component';
import { DocumentPageComponent } from './document-page.component';
import { EmbeddingsPageComponent } from './embeddings-page.component';
import { LlmDbPageComponent } from './llm-db-page.component';
import { LlmPageComponent } from './llm-page.component';
import { PluginShellComponent } from './plugin-shell.component';
import { VectorPageComponent } from './vector-page.component';

const routes: Routes = PlatformHelper.updatePluginsRoutes([
  {
    path: '',
    component: PluginShellComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'chat'
      },
      {
        path: 'chat',
        component: ChatPageComponent
      },
      {
        path: 'llm-db',
        component: LlmDbPageComponent
      },
      {
        path: 'document',
        component: DocumentPageComponent
      },
      {
        path: 'embeddings',
        component: EmbeddingsPageComponent
      },
      {
        path: 'llm',
        component: LlmPageComponent
      },
      {
        path: 'vector',
        component: VectorPageComponent
      },
      {
        path: '**',
        redirectTo: 'chat'
      }
    ]
  }
]);

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
