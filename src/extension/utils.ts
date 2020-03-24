import { Network, NetworkType } from '@airgap/beacon-sdk/dist/messages/Messages'
import { TezosProtocol } from 'airgap-coin-lib'

export const getProtocolForNetwork = async (network: Network): Promise<TezosProtocol> => {
  const rpcUrls: { [key in NetworkType]: string } = {
    [NetworkType.MAINNET]: 'https://tezos-node.prod.gke.papers.tech',
    [NetworkType.BABYLONNET]: 'https://tezos-babylonnet-node-1.kubernetes.papers.tech',
    [NetworkType.CARTHAGENET]: 'https://tezos-carthagenet-node-1.kubernetes.papers.tech',
    [NetworkType.CUSTOM]: ''
  }

  const apiUrls: { [key in NetworkType]: string } = {
    [NetworkType.MAINNET]: 'https://tezos-mainnet-conseil-1.kubernetes.papers.tech',
    [NetworkType.BABYLONNET]: 'https://tezos-babylonnet-conseil-1.kubernetes.papers.tech',
    [NetworkType.CARTHAGENET]: 'https://tezos-carthagenet-conseil-1.kubernetes.papers.tech',
    [NetworkType.CUSTOM]: ''
  }
  const rpcUrl: string = network.rpcUrl ? network.rpcUrl : rpcUrls[network.type]
  const apiUrl: string = apiUrls[network.type]

  return new TezosProtocol(rpcUrl, apiUrl)
}
