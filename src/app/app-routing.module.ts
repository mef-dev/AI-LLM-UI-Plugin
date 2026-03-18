import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlatformHelper } from '@natec/mef-dev-platform-connector';
import { HelloPageComponent } from './hello-page.component';

const routes: Routes = PlatformHelper.updatePluginsRoutes([
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'hello'
  },
  {
    path: 'hello',
    component: HelloPageComponent
  },
  {
    path: '**',
    redirectTo: 'hello'
  }
]);

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
