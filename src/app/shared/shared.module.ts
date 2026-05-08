import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ModulePageComponent } from './components/module-page/module-page.component';

@NgModule({
  declarations: [ModulePageComponent],
  imports: [CommonModule],
  exports: [CommonModule, ModulePageComponent],
})
export class SharedModule {}
