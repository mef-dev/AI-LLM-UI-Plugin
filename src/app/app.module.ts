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
import { environment } from '../environments/environment';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PluginShellComponent } from './container/plugin-shell/plugin-shell.component';
import { PluginSidebarComponent } from './container/plugin-sidebar/plugin-sidebar.component';

@NgModule({
  declarations: [
    AppComponent,
    PluginShellComponent,
    PluginSidebarComponent,
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
