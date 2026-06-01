import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ResponsesPageComponent } from './pages/responses-page/responses-page.component';

const routes: Routes = [
  {
    path: '',
    component: ResponsesPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ResponsesRoutingModule {}
