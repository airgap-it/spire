import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CustomizeOperationParametersPage } from './customize-operation-parameters.page';

const routes: Routes = [
  {
    path: '',
    component: CustomizeOperationParametersPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CustomizeOperationParametersPageRoutingModule {}
