import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ResponsesPageComponent } from './pages/responses-page/responses-page.component';
import { ResponsesWorkspaceComponent } from './components/responses-workspace/responses-workspace.component';
import { ResponsesRoutingModule } from './responses-routing.module';

@NgModule({
  declarations: [ResponsesPageComponent, ResponsesWorkspaceComponent],
  imports: [CommonModule, FormsModule, ResponsesRoutingModule],
})
export class ResponsesModule {}
