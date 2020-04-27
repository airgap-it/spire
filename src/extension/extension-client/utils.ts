import { Network, NetworkType } from '@airgap/beacon-sdk'
import { TezosProtocol } from 'airgap-coin-lib'

export const getProtocolForNetwork: (network: Network) => Promise<TezosProtocol> = async (
  network: Network
): Promise<TezosProtocol> => {
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

  return new TezosProtocol(rpcUrl, apiUrl)
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
