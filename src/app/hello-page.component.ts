import { Component, OnInit } from '@angular/core';
import { PlatformHelper, UiProfileViewModel } from '@natec/mef-dev-platform-connector';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-hello-page',
  standalone: false,
  templateUrl: './hello-page.component.html',
  styleUrls: ['./hello-page.component.scss']
})
export class HelloPageComponent implements OnInit {
  mode: 'local' | 'platform' = 'local';
  platformData: UiProfileViewModel | null = null;

  ngOnInit(): void {
    PlatformHelper.loadPlatformOptions()
      .pipe(catchError(() => of(null)))
      .subscribe((data) => {
        if (!data) {
          return;
        }

        this.mode = 'platform';
        this.platformData = data;
      });
  }

  get summaryItems(): string[] {
    if (!this.platformData) {
      return [
        'Running locally as a plain Angular build.',
        'The connector will switch to platform mode automatically after upload.',
        'Menu routing is configured through metadata.json.'
      ];
    }

    return [
      `Alias: ${this.platformData.alias || 'not provided'}`,
      `Plugin API: ${this.platformData.pluginApiUrl}`,
      `Platform API: ${this.platformData.platformApiUrl}`
    ];
  }
}
