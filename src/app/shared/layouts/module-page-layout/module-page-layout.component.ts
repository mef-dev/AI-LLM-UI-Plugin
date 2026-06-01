import { Component, Input } from '@angular/core';
import { ModulePageLayoutConfig } from './module-page-layout.models';

@Component({
  selector: 'app-module-page-layout',
  standalone: false,
  templateUrl: './module-page-layout.component.html',
  styleUrls: ['./module-page-layout.component.scss']
})
export class ModulePageLayoutComponent {
  @Input({ required: true }) config!: ModulePageLayoutConfig;

  get badgeToneClass(): string {
    switch (this.config.badgeTone) {
      case 'warning':
        return 'status-chip--warning';
      case 'success':
        return 'status-chip--success';
      default:
        return 'status-chip--neutral';
    }
  }
}
