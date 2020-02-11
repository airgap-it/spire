import { NgModule } from '@angular/core'
import { PreloadAllModules, RouterModule, Routes } from '@angular/router'

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'pair',
    loadChildren: () => import('./pages/pair/pair.module').then(m => m.PairPageModule)
  },
  {
    path: 'local-mnemonic',
    loadChildren: () => import('./pages/local-mnemonic/local-mnemonic.module').then(m => m.ListPageModule)
  },
  {
    path: 'settings',
    loadChildren: () => import('./pages/settings/settings.module').then(m => m.SettingsPageModule)
  },
  {
    path: 'add-wallet-connection',
    loadChildren: () =>
      import('./pages/add-wallet-connection/add-wallet-connection.module').then(m => m.AddWalletConnectionPageModule)
  },
  {
    path: 'beacon-request',
    loadChildren: () => import('./pages/beacon-request/beacon-request.module').then(m => m.BeaconRequestPageModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then(m => m.HomePageModule)
  }
]

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
