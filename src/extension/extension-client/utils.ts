import { Network, NetworkType } from '@airgap/beacon-sdk'
import {
  TezblockBlockExplorer,
  TezosProtocol,
  TezosProtocolNetwork,
  TezosProtocolNetworkExtras,
  TezosProtocolOptions
} from '@airgap/coinlib-core'
import { TezosNetwork } from '@airgap/coinlib-core/protocols/tezos/TezosProtocol'
import { NetworkType as AirGapNetworkType } from '@airgap/coinlib-core/utils/ProtocolNetwork'

export const getRpcUrlForNetwork: (network: Network) => Promise<{ rpcUrl: string; apiUrl: string }> = async (
  network: Network
): Promise<{ rpcUrl: string; apiUrl: string }> => {
  const rpcUrls: { [key in NetworkType]: string } = {
    [NetworkType.MAINNET]: 'https://tezos-node.prod.gke.papers.tech',
    [NetworkType.DELPHINET]: 'https://tezos-delphinet-node.prod.gke.papers.tech',
    [NetworkType.EDONET]: 'https://tezos-edonet-node.prod.gke.papers.tech',
    [NetworkType.FLORENCENET]: 'https://florence-tezos.giganode.io',
    [NetworkType.CUSTOM]: ''
  }
  const apiUrls: { [key in NetworkType]: string } = {
    [NetworkType.MAINNET]: 'https://tezos-mainnet-conseil.prod.gke.papers.tech',
    [NetworkType.DELPHINET]: 'https://tezos-delphinet-conseil.prod.gke.papers.tech',
    [NetworkType.EDONET]: 'https://tezos-edonet-conseil.prod.gke.papers.tech',
    [NetworkType.FLORENCENET]: '',
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
    [NetworkType.DELPHINET]: 'Delphinet',
    [NetworkType.EDONET]: 'Edonet',
    [NetworkType.FLORENCENET]: 'Florencenet',
    [NetworkType.CUSTOM]: 'Custom'
  }
  const airgapNetworks: { [key in NetworkType]: AirGapNetworkType } = {
    [NetworkType.MAINNET]: AirGapNetworkType.MAINNET,
    [NetworkType.DELPHINET]: AirGapNetworkType.TESTNET,
    [NetworkType.EDONET]: AirGapNetworkType.TESTNET,
    [NetworkType.FLORENCENET]: AirGapNetworkType.TESTNET,
    [NetworkType.CUSTOM]: AirGapNetworkType.CUSTOM
  }
  const blockExplorers: { [key in NetworkType]: string } = {
    [NetworkType.MAINNET]: 'https://tezblock.io',
    [NetworkType.DELPHINET]: 'https://delphinet.tezblock.io',
    [NetworkType.EDONET]: 'https://edonet.tezblock.io',
    [NetworkType.FLORENCENET]: 'https://florencenet.tezblock.io',
    [NetworkType.CUSTOM]: 'https://florencenet.tezblock.io'
}
  const tezosNetworks: { [key in NetworkType]: TezosNetwork } = {
    [NetworkType.MAINNET]: TezosNetwork.MAINNET,
    [NetworkType.DELPHINET]: TezosNetwork.DELPHINET,
    [NetworkType.EDONET]: TezosNetwork.EDONET,
    [NetworkType.FLORENCENET]: TezosNetwork.EDONET, // TODO: UPDATE IN COINLIB
    [NetworkType.CUSTOM]: TezosNetwork.EDONET
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
    [NetworkType.DELPHINET]: 'https://delphinet.tezblock.io/account/',
    [NetworkType.EDONET]: 'https://edonet.tezblock.io/account/',
    [NetworkType.FLORENCENET]: 'https://florencenet.tezblock.io/account/',
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
