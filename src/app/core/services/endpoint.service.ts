import { Injectable } from '@angular/core';
import { PlatformHelper } from '@natec/mef-dev-platform-connector';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class EndpointService {
  private get pluginData() {
    return PlatformHelper.PluginDataSync as
      | { apiUrl?: string; alias?: string }
      | undefined;
  }

  get baseUrl(): string {
    const apiUrl = this.pluginData?.apiUrl ?? environment.apiUrl;
    const alias = this.pluginData?.alias ?? environment.alias;

    return `${apiUrl}/api/v2/${alias}`;
  }
}
