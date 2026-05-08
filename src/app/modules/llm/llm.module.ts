import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LlmRegistryDetailsComponent } from './components/llm-registry-details/llm-registry-details.component';
import { LlmRegistryFiltersComponent } from './components/llm-registry-filters/llm-registry-filters.component';
import { LlmRegistryFormComponent } from './components/llm-registry-form/llm-registry-form.component';
import { LlmRegistryListComponent } from './components/llm-registry-list/llm-registry-list.component';
import { LlmRegistryUploadComponent } from './components/llm-registry-upload/llm-registry-upload.component';
import { LlmRegistryWorkspaceComponent } from './components/llm-registry-workspace/llm-registry-workspace.component';
import { LlmPageComponent } from './pages/llm-page/llm-page.component';
import { LlmRoutingModule } from './llm-routing.module';

@NgModule({
  declarations: [
    LlmRegistryDetailsComponent,
    LlmRegistryFiltersComponent,
    LlmRegistryFormComponent,
    LlmRegistryListComponent,
    LlmRegistryUploadComponent,
    LlmRegistryWorkspaceComponent,
    LlmPageComponent,
  ],
  imports: [CommonModule, FormsModule, LlmRoutingModule],
})
export class LlmModule {}
