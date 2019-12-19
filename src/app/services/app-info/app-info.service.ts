import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root'
})
export class AppInfoProvider {
  public appName = 'APP_NAME'
  public packageName = 'PACKAGE_NAME'
  public versionNumber = 'VERSION_NUMBER'
  public versionCode: string | number = 'VERSION_CODE'

  constructor() {}

  public async getAppName() {
    return this.appName
  }

  public async getPackageName() {
    return this.packageName
  }

  public async getVersionNumber() {
    return this.versionNumber
  }

  public async getVersionCode() {
    return this.versionCode
  }
}
