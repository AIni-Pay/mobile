/**
 * Configuraciones de redes Celestia
 */

export const CELESTIA_NETWORKS = {
  MAINNET: {
    chainId: 'celestia',
    name: 'Celestia Mainnet Beta',
    currency: {
      symbol: 'TIA',
      baseDenom: 'utia',
      decimals: 6,
      // 1 TIA = 1,000,000 utia
      baseMultiplier: 1000000
    },
    addressPrefix: 'celestia',
    rpc: 'https://celestia-mainnet-rpc.itrocket.net:443',
    rest: 'https://celestia-mainnet-api.itrocket.net:443',
    type: 'mainnet'
  },
  
  MOCHA_TESTNET: {
    chainId: 'mocha-4',
    name: 'Celestia Mocha Testnet',
    currency: {
      symbol: 'TIA',
      baseDenom: 'utia',
      decimals: 6,
      // 1 TIA = 1,000,000 utia
      baseMultiplier: 1000000
    },
    addressPrefix: 'celestia',
    rpc: 'https://celestia-testnet-rpc.itrocket.net:443',
    rest: 'https://celestia-testnet-api.itrocket.net:443',
    type: 'testnet'
  }
};

/**
 * Detectar red por chain ID
 */
export function getNetworkByChainId(chainId) {
  return Object.values(CELESTIA_NETWORKS).find(network => network.chainId === chainId);
}

/**
 * Detectar red por nombre
 */
export function getNetworkByName(name) {
  const normalizedName = name.toLowerCase();
  
  if (normalizedName.includes('mainnet') || normalizedName.includes('main')) {
    return CELESTIA_NETWORKS.MAINNET;
  }
  
  if (normalizedName.includes('mocha') || normalizedName.includes('testnet') || normalizedName.includes('test')) {
    return CELESTIA_NETWORKS.MOCHA_TESTNET;
  }
  
  return null;
}

/**
 * Convertir TIA a utia
 */
export function tiaToUtia(tiaAmount) {
  return Math.floor(tiaAmount * 1000000);
}

/**
 * Convertir utia a TIA
 */
export function utiaToTia(utiaAmount) {
  return utiaAmount / 1000000;
}

/**
 * Validar dirección Celestia
 */
export function isValidCelestiaAddress(address) {
  return /^celestia1[0-9a-z]{38,58}$/.test(address);
}

/**
 * Lista de redes disponibles para mostrar al usuario
 */
export const NETWORK_OPTIONS = [
  {
    key: 'mainnet',
    name: 'Celestia Mainnet Beta',
    description: 'Red principal de Celestia',
    config: CELESTIA_NETWORKS.MAINNET
  },
  {
    key: 'mocha',
    name: 'Celestia Mocha Testnet', 
    description: 'Red de pruebas Mocha',
    config: CELESTIA_NETWORKS.MOCHA_TESTNET
  }
];