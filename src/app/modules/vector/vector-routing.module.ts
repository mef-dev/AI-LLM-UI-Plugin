import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VectorPageComponent } from './pages/vector-page/vector-page.component';

const routes: Routes = [
  {
    path: '',
    component: VectorPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VectorRoutingModule {}
