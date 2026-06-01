import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LlmPageComponent } from './pages/llm-page/llm-page.component';

const routes: Routes = [
  {
    path: '',
    component: LlmPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LlmRoutingModule {}
