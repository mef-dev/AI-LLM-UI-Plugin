import { Component, Input } from '@angular/core';

type ModuleSection = {
  title: string;
  text: string;
};

type ModuleAction = {
  label: string;
  description: string;
};

export type ModulePageConfig = {
  name: string;
  subtitle: string;
  purpose: string;
  sections: ModuleSection[];
  actions: ModuleAction[];
};

@Component({
  selector: 'app-module-page',
  standalone: false,
  templateUrl: './module-page.component.html',
  styleUrls: ['./module-page.component.scss']
})
export class ModulePageComponent {
  @Input({ required: true }) config!: ModulePageConfig;
}
