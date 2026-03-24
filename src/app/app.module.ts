import { APP_BASE_HREF } from '@angular/common';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { inject, NgModule, provideAppInitializer } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  MefDevAuthInterceptor,
  PlatformHelper,
  UiProfileViewModel,
} from '@natec/mef-dev-platform-connector';
import { catchError, map } from 'rxjs';
import { environment } from 'src/environments/environment';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PluginShellComponent } from './container/plugin-shell/plugin-shell.component';
import { ChatPageComponent } from './modules/chat/pages/chat-page/chat-page.component';
import { DocumentPageComponent } from './modules/document/pages/document-page/document-page.component';
import { EmbeddingsPageComponent } from './modules/embeddings/pages/embeddings-page/embeddings-page.component';
import { LlmDbPageComponent } from './modules/llm-db/pages/llm-db-page/llm-db-page.component';
import { LlmPageComponent } from './modules/llm/pages/llm-page/llm-page.component';
import { VectorPageComponent } from './modules/vector/pages/vector-page/vector-page.component';
import { ModulePageComponent } from './shared/components/module-page/module-page.component';

@NgModule({
  declarations: [
    AppComponent,
    PluginShellComponent,
    ModulePageComponent,
    ChatPageComponent,
    LlmDbPageComponent,
    DocumentPageComponent,
    EmbeddingsPageComponent,
    LlmPageComponent,
    VectorPageComponent,
  ],
  imports: [BrowserModule, BrowserAnimationsModule, AppRoutingModule],
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
