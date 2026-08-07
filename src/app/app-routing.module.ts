import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PluginShellComponent } from './container/plugin-shell/plugin-shell.component';

// Routes are declared directly; the platform base path comes from APP_BASE_HREF
// in app.module.ts (PlatformHelper.updatePluginsRoutes is deprecated since
// @natec/mef-dev-platform-connector ^16.4.8).
const routes: Routes = [
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
        loadChildren: () => import('./modules/chat/chat.module').then((module) => module.ChatModule)
      },
      {
        path: 'responses',
        loadChildren: () => import('./modules/responses/responses.module').then((module) => module.ResponsesModule)
      },
      {
        path: 'llm-db',
        redirectTo: 'vector',
        pathMatch: 'full'
      },
      {
        path: 'document',
        loadChildren: () => import('./modules/document/document.module').then((module) => module.DocumentModule)
      },
      {
        path: 'embeddings',
        loadChildren: () => import('./modules/embeddings/embeddings.module').then((module) => module.EmbeddingsModule)
      },
      {
        path: 'llm',
        loadChildren: () => import('./modules/llm/llm.module').then((module) => module.LlmModule)
      },
      {
        path: 'vector',
        loadChildren: () => import('./modules/vector/vector.module').then((module) => module.VectorModule)
      },
      {
        path: '**',
        redirectTo: 'chat'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
