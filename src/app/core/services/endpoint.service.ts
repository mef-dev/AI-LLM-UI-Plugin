import { Injectable } from '@angular/core';
import { PlatformHelper } from '@natec/mef-dev-platform-connector';

@Injectable({ providedIn: 'root' })
export class EndpointService {
  private get pluginData() {
    return PlatformHelper.PluginDataSync;
  }

  get baseUrl(): string {
    return `${this.pluginData.apiUrl}/api/v2/${this.pluginData.alias}`;
  }
}
