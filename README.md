# Beacon Extension

> Connect Wallets with dApps on Tezos

[Beacon](https://walletbeacon.io) is the implementation of the wallet interaction standard [tzip-10](https://gitlab.com/tzip/tzip/blob/master/proposals/tzip-10/tzip-10.md) which describes the connnection of a dApp with a wallet.

## Intro

The Beacon Extension implements the [beacon-sdk](https://github.com/airgap-it/beacon-sdk) to interact with dApps that have implemented the beacon-sdk and use the various signing methods (Wallets, Ledger and local secret) to sign and broadcast various message types.

## Requirements

```bash
npm >= 6
NodeJS >= 10
```

## Build

First follow the steps below to install the dependencies:

```bash
$ git clone https://github.com/airgap-it/beacon-extension.git
$ cd beacon-extension
$ npm install -g ionic
$ npm install
```

Run locally in browser:

```bash
$ ionic serve
```

## Security

If you discover a security vulnerability within this application, please send an e-mail to hi@airgap.it. All security vulnerabilities will be promptly addressed.

## Contributing

- If you find any bugs, submit an [issue](../../issues) or open [pull-request](../../pulls), helping us catch and fix them.
- Engage with other users and developers on the [AirGap Telegram](https://t.me/AirGap).
