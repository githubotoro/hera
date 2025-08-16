import { Injectable, Logger } from '@nestjs/common';
import {
  Chain,
  createPublicClient,
  http,
  PublicClient,
  HttpTransport,
} from 'viem';
import { AppConfig } from '../config/config';
import { base, baseSepolia } from 'viem/chains';

const CONFIG = AppConfig();

@Injectable()
export class ViemService {
  private readonly logger = new Logger(ViemService.name);
  private readonly clients: Map<number, PublicClient[]> = new Map();

  constructor() {
    this.logger.log('Initializing ViemService...');
    this.setupClients();
    this.logger.log(
      `Initialized clients for ${this.getAllChainIds().length} chains`,
    );
  }

  private setupClientsForChain(
    chainId: number,
    chain: Chain,
    rpcUrls: readonly string[],
  ) {
    if (rpcUrls.length === 0) return;

    const chainClients = rpcUrls.map((url) =>
      createPublicClient({
        chain,
        transport: http(url),
      }),
    );

    this.clients.set(
      chainId,
      chainClients as PublicClient<HttpTransport, Chain>[],
    );
    this.logger.log(
      `Initialized ${chainClients.length} clients for chain ${chainId}`,
    );
  }

  private setupClients() {
    // Base
    this.setupClientsForChain(base.id, base as Chain, CONFIG.RPC_URLS_8453);

    // Base Sepolia
    this.setupClientsForChain(
      baseSepolia.id,
      baseSepolia as Chain,
      CONFIG.RPC_URLS_84532,
    );
  }

  getRandomClient(
    chainId: number | string,
  ): PublicClient<HttpTransport, Chain> {
    const clients = this.clients.get(
      typeof chainId === 'string' ? parseInt(chainId) : chainId,
    );
    if (!clients || clients.length === 0) return undefined;
    const randomIndex = Math.floor(Math.random() * clients.length);
    return clients[randomIndex] as PublicClient<HttpTransport, Chain>;
  }

  getAllClients(chainId: number): any[] {
    return this.clients.get(chainId) || [];
  }

  getAllChainIds(): number[] {
    return Array.from(this.clients.keys());
  }
}
