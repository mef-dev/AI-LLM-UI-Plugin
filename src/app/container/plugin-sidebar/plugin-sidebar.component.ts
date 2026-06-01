import { Component } from '@angular/core';
import { PLUGIN_NAVIGATION_ITEMS } from '../../core/navigation/plugin-navigation';

@Component({
  selector: 'app-plugin-sidebar',
  standalone: false,
  templateUrl: './plugin-sidebar.component.html',
  styleUrls: ['./plugin-sidebar.component.scss']
})
export class PluginSidebarComponent {
  readonly navigationItems = PLUGIN_NAVIGATION_ITEMS;
}
