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
    [NetworkType.FLORENCENET]: 'https://tezos-florencenet-node.prod.gke.papers.tech',
    [NetworkType.GRANADANET]: 'https://tezos-granadanet-node.prod.gke.papers.tech',
    [NetworkType.HANGZHOUNET]: 'https://tezos-hangzhounet-node.prod.gke.papers.tech',
    [NetworkType.ITHACANET]: 'https://tezos-ithacanet-node.prod.gke.papers.tech',
    [NetworkType.JAKARTANET]: 'https://tezos-jakartanet-node.prod.gke.papers.tech',
    [NetworkType.CUSTOM]: ''
  }
  const apiUrls: { [key in NetworkType]: string } = {
    [NetworkType.MAINNET]: 'https://tezos-mainnet-conseil.prod.gke.papers.tech',
    [NetworkType.DELPHINET]: 'https://tezos-delphinet-conseil.prod.gke.papers.tech',
    [NetworkType.EDONET]: 'https://tezos-edonet-conseil.prod.gke.papers.tech',
    [NetworkType.FLORENCENET]: 'https://tezos-florencenet-conseil.prod.gke.papers.tech',
    [NetworkType.GRANADANET]: 'https://tezos-granadanet-conseil.prod.gke.papers.tech',
    [NetworkType.HANGZHOUNET]: 'https://tezos-hangzhounet-conseil.prod.gke.papers.tech',
    [NetworkType.ITHACANET]: 'https://tezos-ithacanet-conseil.prod.gke.papers.tech',
    [NetworkType.JAKARTANET]: 'https://tezos-jakartanet-conseil.prod.gke.papers.tech',
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
    [NetworkType.GRANADANET]: 'Granadanet',
    [NetworkType.HANGZHOUNET]: 'Hangzhounet',
    [NetworkType.ITHACANET]: 'Ithacanet',
    [NetworkType.JAKARTANET]: 'Jakartanet',
    [NetworkType.CUSTOM]: 'Custom'
  }
  const airgapNetworks: { [key in NetworkType]: AirGapNetworkType } = {
    [NetworkType.MAINNET]: AirGapNetworkType.MAINNET,
    [NetworkType.DELPHINET]: AirGapNetworkType.TESTNET,
    [NetworkType.EDONET]: AirGapNetworkType.TESTNET,
    [NetworkType.FLORENCENET]: AirGapNetworkType.TESTNET,
    [NetworkType.GRANADANET]: AirGapNetworkType.TESTNET,
    [NetworkType.HANGZHOUNET]: AirGapNetworkType.TESTNET,
    [NetworkType.ITHACANET]: AirGapNetworkType.TESTNET,
    [NetworkType.JAKARTANET]: AirGapNetworkType.TESTNET,
    [NetworkType.CUSTOM]: AirGapNetworkType.CUSTOM
  }
  const blockExplorers: { [key in Exclude<NetworkType, NetworkType.DELPHINET>]: string } = {
    [NetworkType.MAINNET]: 'https://tezblock.io',
    [NetworkType.EDONET]: 'https://edonet.tezblock.io',
    [NetworkType.FLORENCENET]: 'https://florencenet.tezblock.io',
    [NetworkType.GRANADANET]: 'https://granadanet.tezblock.io',
    [NetworkType.HANGZHOUNET]: 'https://hangzhounet.tezblock.io',
    [NetworkType.ITHACANET]: 'https://ithacanet.tezblock.io/account',
    [NetworkType.JAKARTANET]: 'https://jakartanet.tezblock.io/account',
    [NetworkType.CUSTOM]: 'https://hangzhounet.tezblock.io'
  }
  const tezosNetworks: { [key in Exclude<NetworkType, NetworkType.DELPHINET>]: TezosNetwork } = {
    [NetworkType.MAINNET]: TezosNetwork.MAINNET,
    [NetworkType.EDONET]: TezosNetwork.EDONET,
    [NetworkType.FLORENCENET]: TezosNetwork.FLORENCENET,
    [NetworkType.GRANADANET]: TezosNetwork.MAINNET,
    [NetworkType.HANGZHOUNET]: TezosNetwork.MAINNET,
    [NetworkType.ITHACANET]: TezosNetwork.MAINNET,
    [NetworkType.JAKARTANET]: TezosNetwork.MAINNET,
    [NetworkType.CUSTOM]: TezosNetwork.MAINNET
  }

  const conseilNetworks: { [key in Exclude<NetworkType, NetworkType.DELPHINET>]: TezosNetwork } = {
    [NetworkType.MAINNET]: TezosNetwork.MAINNET,
    [NetworkType.EDONET]: TezosNetwork.EDONET,
    [NetworkType.FLORENCENET]: TezosNetwork.FLORENCENET,
    [NetworkType.GRANADANET]: TezosNetwork.MAINNET,
    [NetworkType.HANGZHOUNET]: TezosNetwork.MAINNET,
    [NetworkType.ITHACANET]: TezosNetwork.MAINNET,
    [NetworkType.JAKARTANET]: TezosNetwork.MAINNET,
    [NetworkType.CUSTOM]: TezosNetwork.MAINNET
  }

  const name: string = names[network.type]
  const airgapNetwork: AirGapNetworkType = airgapNetworks[network.type]
  const blockExplorer: string = blockExplorers[network.type]
  const tezosNetwork: TezosNetwork = tezosNetworks[network.type]
  const conseilNetwork: TezosNetwork = conseilNetworks[network.type]

  return new TezosProtocol(
    new TezosProtocolOptions(
      new TezosProtocolNetwork(
        name,
        airgapNetwork,
        rpcUrl,
        new TezblockBlockExplorer(blockExplorer),
        new TezosProtocolNetworkExtras(tezosNetwork, apiUrl, conseilNetwork, 'airgap00391')
      )
    )
  )
}

export const getTezblockLinkForNetwork: (network: Network | undefined) => Promise<string> = async (
  network: Network | undefined
): Promise<string> => {
  const urls: { [key in NetworkType]: string } = {
    [NetworkType.MAINNET]: 'https://tezblock.io/account/',
    [NetworkType.DELPHINET]: 'https://delphinet.tezblock.io/account/',
    [NetworkType.EDONET]: 'https://edonet.tezblock.io/account/',
    [NetworkType.FLORENCENET]: 'https://florencenet.tezblock.io/account/',
    [NetworkType.GRANADANET]: 'https://granadanet.tezblock.io/account',
    [NetworkType.HANGZHOUNET]: 'https://hangzhounet.tezblock.io/account',
    [NetworkType.ITHACANET]: 'https://ithacanet.tezblock.io/account',
    [NetworkType.JAKARTANET]: 'https://jakartanet.tezblock.io/account',
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
