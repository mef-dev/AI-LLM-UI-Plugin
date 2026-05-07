import { APP_BASE_HREF } from '@angular/common';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { inject, NgModule, provideAppInitializer } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  MefDevAuthInterceptor,
  PlatformHelper,
  UiProfileViewModel,
} from '@natec/mef-dev-platform-connector';
import { catchError, map } from 'rxjs';
import { environment } from '../environments/environment';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PluginShellComponent } from './container/plugin-shell/plugin-shell.component';
import { PluginSidebarComponent } from './container/plugin-sidebar/plugin-sidebar.component';
import { ChatPlaygroundHeroComponent } from './modules/chat/components/chat-playground-hero/chat-playground-hero.component';
import { ChatMessagesEditorComponent } from './modules/chat/components/chat-messages-editor/chat-messages-editor.component';
import { ChatPlaygroundComponent } from './modules/chat/components/chat-playground/chat-playground.component';
import { ChatRequestSettingsComponent } from './modules/chat/components/chat-request-settings/chat-request-settings.component';
import { ChatResponsePreviewComponent } from './modules/chat/components/chat-response-preview/chat-response-preview.component';
import { ChatPageComponent } from './modules/chat/pages/chat-page/chat-page.component';
import { DocumentPageComponent } from './modules/document/pages/document-page/document-page.component';
import { DocumentWorkspaceComponent } from './modules/document/components/document-workspace/document-workspace.component';
import { EmbeddingsWorkspaceComponent } from './modules/embeddings/components/embeddings-workspace/embeddings-workspace.component';
import { EmbeddingsPageComponent } from './modules/embeddings/pages/embeddings-page/embeddings-page.component';
import { LlmRegistryFiltersComponent } from './modules/llm/components/llm-registry-filters/llm-registry-filters.component';
import { LlmRegistryDetailsComponent } from './modules/llm/components/llm-registry-details/llm-registry-details.component';
import { LlmRegistryFormComponent } from './modules/llm/components/llm-registry-form/llm-registry-form.component';
import { LlmRegistryListComponent } from './modules/llm/components/llm-registry-list/llm-registry-list.component';
import { LlmRegistryUploadComponent } from './modules/llm/components/llm-registry-upload/llm-registry-upload.component';
import { LlmRegistryWorkspaceComponent } from './modules/llm/components/llm-registry-workspace/llm-registry-workspace.component';
import { LlmDbPageComponent } from './modules/llm-db/pages/llm-db-page/llm-db-page.component';
import { LlmPageComponent } from './modules/llm/pages/llm-page/llm-page.component';
import { ResponsesWorkspaceComponent } from './modules/responses/components/responses-workspace/responses-workspace.component';
import { ResponsesPageComponent } from './modules/responses/pages/responses-page/responses-page.component';
import { VectorPageComponent } from './modules/vector/pages/vector-page/vector-page.component';
import { VectorWorkspaceComponent } from './modules/vector/components/vector-workspace/vector-workspace.component';
import { ModulePageComponent } from './shared/components/module-page/module-page.component';

@NgModule({
  declarations: [
    AppComponent,
    PluginShellComponent,
    PluginSidebarComponent,
    ModulePageComponent,
    ChatMessagesEditorComponent,
    ChatPlaygroundHeroComponent,
    ChatPlaygroundComponent,
    ChatPageComponent,
    ResponsesWorkspaceComponent,
    ResponsesPageComponent,
    ChatRequestSettingsComponent,
    ChatResponsePreviewComponent,
    LlmDbPageComponent,
    DocumentPageComponent,
    DocumentWorkspaceComponent,
    EmbeddingsWorkspaceComponent,
    EmbeddingsPageComponent,
    LlmRegistryDetailsComponent,
    LlmRegistryFiltersComponent,
    LlmRegistryFormComponent,
    LlmRegistryListComponent,
    LlmRegistryUploadComponent,
    LlmRegistryWorkspaceComponent,
    LlmPageComponent,
    VectorWorkspaceComponent,
    VectorPageComponent,
  ],
  imports: [BrowserModule, BrowserAnimationsModule, FormsModule, AppRoutingModule],
  providers: [
    {
      provide: APP_BASE_HREF,
      useFactory: PlatformHelper.getAppBasePath,
    },
    provideAppInitializer(loadPluginData),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MefDevAuthInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

function loadPluginData() {
  const http = inject(HttpClient);

  return PlatformHelper.loadPlatformOptions().pipe(
    map((data: UiProfileViewModel) => {
      console.warn('Platform data loaded');
      return data;
    }),
    catchError((err) => {
      console.warn('Platform data not detected');
      if (environment.production) {
        throw err;
      }
      return PlatformHelper.setOptions({
        httpClient: http as any,
        alias: (environment as any).alias ?? 'ai',
        apiUrl: (environment as any).apiUrl ?? 'https://sandbox.mef.dev',
        pluginName: 'ai-llm-ui',
        headers: {
          Authorization: `Basic ${btoa((environment as any).bauth)}`,
        },
      });
    }),
  );
}
