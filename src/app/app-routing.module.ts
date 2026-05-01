import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlatformHelper } from '@natec/mef-dev-platform-connector';
import { PluginShellComponent } from './container/plugin-shell/plugin-shell.component';
import { ChatPageComponent } from './modules/chat/pages/chat-page/chat-page.component';
import { DocumentPageComponent } from './modules/document/pages/document-page/document-page.component';
import { EmbeddingsPageComponent } from './modules/embeddings/pages/embeddings-page/embeddings-page.component';
import { LlmDbPageComponent } from './modules/llm-db/pages/llm-db-page/llm-db-page.component';
import { LlmPageComponent } from './modules/llm/pages/llm-page/llm-page.component';
import { ResponsesPageComponent } from './modules/responses/pages/responses-page/responses-page.component';
import { VectorPageComponent } from './modules/vector/pages/vector-page/vector-page.component';

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
        path: 'responses',
        component: ResponsesPageComponent
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
