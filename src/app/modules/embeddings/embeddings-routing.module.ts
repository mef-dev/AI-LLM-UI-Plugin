import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmbeddingsPageComponent } from './pages/embeddings-page/embeddings-page.component';

const routes: Routes = [
  {
    path: '',
    component: EmbeddingsPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EmbeddingsRoutingModule {}
