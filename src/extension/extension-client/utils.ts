import { Network, NetworkType } from '@airgap/beacon-sdk'
import {
  TezblockBlockExplorer,
  TezosProtocol,
  TezosProtocolNetwork,
  TezosProtocolNetworkExtras,
  TezosProtocolOptions
} from 'airgap-coin-lib'
import { TezosNetwork } from 'airgap-coin-lib/dist/protocols/tezos/TezosProtocol'
import { NetworkType as AirGapNetworkType } from 'airgap-coin-lib/dist/utils/ProtocolNetwork'

export const getRpcUrlForNetwork: (network: Network) => Promise<{ rpcUrl: string; apiUrl: string }> = async (
  network: Network
): Promise<{ rpcUrl: string; apiUrl: string }> => {
  const rpcUrls: { [key in NetworkType]: string } = {
    [NetworkType.MAINNET]: 'https://tezos-node.prod.gke.papers.tech',
    [NetworkType.CARTHAGENET]: 'https://tezos-carthagenet-node-1.kubernetes.papers.tech',
    [NetworkType.CUSTOM]: ''
  }

  const apiUrls: { [key in NetworkType]: string } = {
    [NetworkType.MAINNET]: 'https://tezos-mainnet-conseil-1.kubernetes.papers.tech',
    [NetworkType.CARTHAGENET]: 'https://tezos-carthagenet-conseil-1.kubernetes.papers.tech',
    [NetworkType.CUSTOM]: ''
  }
  const rpcUrl: string = network.rpcUrl ? network.rpcUrl : rpcUrls[network.type]
  const apiUrl: string = apiUrls[network.type]

  return { rpcUrl, apiUrl }
}

export const getProtocolForNetwork: (network: Network) => Promise<TezosProtocol> = async (
  network: Network
): Promise<TezosProtocol> => {
  const { rpcUrl, apiUrl }: { rpcUrl: string; apiUrl: string } = await getRpcUrlForNetwork(network)

  const names: { [key in NetworkType]: string } = {
    [NetworkType.MAINNET]: 'Mainnet',
    [NetworkType.CARTHAGENET]: 'Carthagenet',
    [NetworkType.CUSTOM]: 'Custom'
  }
  const airgapNetworks: { [key in NetworkType]: AirGapNetworkType } = {
    [NetworkType.MAINNET]: AirGapNetworkType.MAINNET,
    [NetworkType.CARTHAGENET]: AirGapNetworkType.TESTNET,
    [NetworkType.CUSTOM]: AirGapNetworkType.CUSTOM
  }
  const blockExplorers: { [key in NetworkType]: string } = {
    [NetworkType.MAINNET]: 'https://tezblock.io',
    [NetworkType.CARTHAGENET]: 'https://carthagenet.tezblock.io',
    [NetworkType.CUSTOM]: 'https://carthagenet.tezblock.io'
  }
  const tezosNetworks: { [key in NetworkType]: TezosNetwork } = {
    [NetworkType.MAINNET]: TezosNetwork.MAINNET,
    [NetworkType.CARTHAGENET]: TezosNetwork.CARTHAGENET,
    [NetworkType.CUSTOM]: TezosNetwork.CARTHAGENET
  }

  const name: string = names[network.type]
  const airgapNetwork: AirGapNetworkType = airgapNetworks[network.type]
  const blockExplorer: string = blockExplorers[network.type]
  const tezosNetwork: TezosNetwork = tezosNetworks[network.type]

  return new TezosProtocol(
    new TezosProtocolOptions(
      new TezosProtocolNetwork(
        name,
        airgapNetwork,
        rpcUrl,
        new TezblockBlockExplorer(blockExplorer),
        new TezosProtocolNetworkExtras(tezosNetwork, apiUrl, tezosNetwork, 'airgap00391')
      )
    )
  )
}

export const getTezblockLinkForNetwork: (network: Network | undefined) => Promise<string> = async (
  network: Network | undefined
): Promise<string> => {
  console.log('network', network)

  const urls: { [key in NetworkType]: string } = {
    [NetworkType.MAINNET]: 'https://tezblock.io/account/',
    [NetworkType.CARTHAGENET]: 'https://carthagenet.tezblock.io/account/',
    [NetworkType.CUSTOM]: 'http://localhost:8100/account/'
  }
  const url: string = urls[network ? network.type : NetworkType.MAINNET]

  return url
}

export type To<T, U = Error> = { err: U; res: undefined } | { err: null; res: T }
export async function to<T, U = Error>(promise: Promise<T>, errorExt?: object): Promise<To<T, U>> {
  try {
    const data: T = await promise

    return { err: null, res: data }
  } catch (err) {
    if (errorExt) {
      Object.assign(err, errorExt)
    }

    return { err, res: undefined }
  }
}

// export async function to<T, U = Error>(promise: Promise<T>, errorExt?: object): Promise<[U | null, T | undefined]> {
//   try {
//     const data: T = await promise

//     return [null, data]
//   } catch (err) {
//     if (errorExt) {
//       Object.assign(err, errorExt)
//     }

//     return [err, undefined]
//   }
// }
