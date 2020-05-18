# Changelog

## 0.5.1 (2020-05-13)

#### Features

- Ledger integration
- All contract calls are now supported in the `operationRequest`
- Show Feedback (eg. RPC Error) if there is an error during the `run_operation` call or injection
- Show list of wallets
- Show list of all permissions that were given to DApps

## 0.4.0 (2020-03-24)

#### Features

- Adds handling of various networks like Carthagenet and Custom networks
- Improved permission handling

## 0.3.0 (2020-02-27)

#### Bug Fixes

- Fixes "No File Found" bug on various operating system and browser combinations
- Fixes custom operations contained invalid parameters error

## 0.2.0 (2020-02-13)

#### Breaking Changes

- Breaking Changes: updated to the latest beacon-sdk where messages are now bs58check encoded

#### Features

- `operationRequests`, `signPayloadRequest`, `broadcastRequest` are now supported with the local mnemonic signing method, which allows direct singing in the extension
- UI changes
- Various improvements

## 0.1.0 (2020-01-30)

#### Features

- Connect with dApps like https://walletbeacon.io
- Local secret
- Initial support for all tzip-10 message types
- Extended support for PermissionRequest
