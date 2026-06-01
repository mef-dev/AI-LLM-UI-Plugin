import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { VectorWorkspaceComponent } from './components/vector-workspace/vector-workspace.component';
import { VectorPageComponent } from './pages/vector-page/vector-page.component';
import { VectorRoutingModule } from './vector-routing.module';

@NgModule({
  declarations: [VectorWorkspaceComponent, VectorPageComponent],
  imports: [SharedModule, FormsModule, VectorRoutingModule],
})
export class VectorModule {}
