/*
Token Registry
Maps token symbols to Solana token mint addresses
Devnet addresses for testing
*/
export const TOKEN_REGISTRY: Record<string, string> = {
  // Wrapped SOL
  'SOL': 'Soasdq324123124zcaeq3e34q4qwqwfrsfafa2122232',
  'WSOL': 'So11111111111111111111111111111111111111112',
  
  // USDC (devnet)
  'USDC': '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Devnet USDC
  
  // USDT (devnet)
  'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // Devnet USDT
  
};

//Get token mint address from symbol
export function getTokenMint(symbol: string): string {
  //Get token mint address from symbol
  const mint = TOKEN_REGISTRY[symbol.toUpperCase()];
  if (!mint) {
    throw new Error(`Token ${symbol} not found in registry. Add it to TOKEN_REGISTRY.`);
  }
  return mint;
}

//Check if token is native SOL
export function isNativeSOL(symbol: string): boolean {
  return symbol.toUpperCase() === 'SOL';
}

