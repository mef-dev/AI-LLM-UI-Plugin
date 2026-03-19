import { Injectable } from '@angular/core';
import { PlatformHelper } from '@natec/mef-dev-platform-connector';

@Injectable({ providedIn: 'root' })
export class EndpointService {
  private corePath = `${PlatformHelper.PluginDataSync!.platformApiUrl}/${
    PlatformHelper.PluginDataSync!.alias
  }/`;
}
