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
import { catchError, map } from 'rxjs';
import { environment } from 'src/environments/environment';

import {
  MefDevAuthInterceptor,
  PlatformHelper,
  UiProfileViewModel,
} from '@natec/mef-dev-platform-connector';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ChatPageComponent } from './chat-page.component';
import { DocumentPageComponent } from './document-page.component';
import { EmbeddingsPageComponent } from './embeddings-page.component';
import { HelloPageComponent } from './hello-page.component';
import { LlmDbPageComponent } from './llm-db-page.component';
import { LlmPageComponent } from './llm-page.component';
import { ModulePageComponent } from './module-page.component';
import { VectorPageComponent } from './vector-page.component';

@NgModule({
  declarations: [
    AppComponent,
    HelloPageComponent,
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
