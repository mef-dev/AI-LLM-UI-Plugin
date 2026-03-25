import { Component, Input } from '@angular/core';
import { ModulePageConfig } from '../../models/module-page.models';

@Component({
  selector: 'app-module-page',
  standalone: false,
  templateUrl: './module-page.component.html',
  styleUrls: ['./module-page.component.scss']
})
export class ModulePageComponent {
  @Input({ required: true }) config!: ModulePageConfig;
}
