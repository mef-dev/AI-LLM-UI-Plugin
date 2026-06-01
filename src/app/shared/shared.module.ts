import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ModulePageLayoutComponent } from './layouts/module-page-layout/module-page-layout.component';

@NgModule({
  declarations: [ModulePageLayoutComponent],
  imports: [CommonModule],
  exports: [CommonModule, ModulePageLayoutComponent],
})
export class SharedModule {}
