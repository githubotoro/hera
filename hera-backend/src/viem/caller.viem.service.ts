import { Injectable, Logger } from '@nestjs/common';
import { ViemService } from './viem.service';
import { Abi, Address } from 'viem';

export interface ContractCall {
  id: string;
  chainId: number;
  address: Address;
  abi: Abi;
  functionName: string;
  args?: unknown[];
}

const BATCH_SIZE = 100;
const MAX_CONCURRENT_CHAINS = 3;

@Injectable()
export class CallerViemService {
  private readonly logger = new Logger(CallerViemService.name);

  constructor(private readonly viemService: ViemService) {}

  /**
   * Process contract calls in batches using multicall
   * @param contracts - Array of contract calls to process
   * @returns Map of contract IDs to their results
   */
  async processContractCalls(
    contracts: ContractCall[],
  ): Promise<Map<string, any | null>> {
    const resultsMap = new Map<string, any | null>();
    const failedCalls: Array<{ contract: ContractCall; error?: string }> = [];

    const contractsByChain = contracts.reduce((acc, contract) => {
      if (!acc.has(contract.chainId)) {
        acc.set(contract.chainId, []);
      }
      acc.get(contract.chainId).push(contract);
      return acc;
    }, new Map<number, ContractCall[]>());

    const chainIds = Array.from(contractsByChain.keys());
    for (let i = 0; i < chainIds.length; i += MAX_CONCURRENT_CHAINS) {
      const chainChunk = chainIds.slice(i, i + MAX_CONCURRENT_CHAINS);
      const chainPromises = chainChunk.map(async (chainId) => {
        const chainContracts = contractsByChain.get(chainId);

        for (let j = 0; j < chainContracts.length; j += BATCH_SIZE) {
          const batch = chainContracts.slice(j, j + BATCH_SIZE);
          await this.processBatch(chainId, batch, resultsMap, failedCalls);
        }
      });

      await Promise.all(chainPromises);
    }

    if (failedCalls.length > 0) {
      this.logger.error({
        msg: `Failed to process ${failedCalls.length} contract calls`,
      });
    }

    const failedCallsByChainAndFunction = failedCalls.reduce(
      (acc, { contract }) => {
        const key = `${contract.chainId}_${contract.functionName}`;
        if (!acc.has(key)) {
          acc.set(key, 0);
        }
        acc.set(key, acc.get(key) + 1);
        return acc;
      },
      new Map<string, number>(),
    );

    const totalCallsByChainAndFunction = contracts.reduce((acc, contract) => {
      const key = `${contract.chainId}_${contract.functionName}`;
      if (!acc.has(key)) {
        acc.set(key, 0);
      }
      acc.set(key, acc.get(key) + 1);
      return acc;
    }, new Map<string, number>());

    totalCallsByChainAndFunction.forEach((total, key) => {
      const [chainId, functionName] = key.split('_');
    });

    failedCallsByChainAndFunction.forEach((failed, key) => {
      const [chainId, functionName] = key.split('_');
    });

    return resultsMap;
  }

  private async processBatch(
    chainId: number,
    batch: ContractCall[],
    resultsMap: Map<string, any | null>,
    failedCalls: Array<{ contract: ContractCall; error?: string }>,
  ): Promise<void> {
    const client = this.viemService.getRandomClient(chainId);
    if (!client) {
      this.logger.error(`No client found for chain ID ${chainId}`);
      batch.forEach((contract) => {
        resultsMap.set(contract.id, null);
        failedCalls.push({ contract, error: 'No client found for chain' });
      });
      return;
    }

    try {
      const contracts = batch.map(({ address, abi, functionName, args }) => ({
        address,
        abi,
        functionName,
        args,
      }));

      // @ts-ignore - Viem types freak out
      const results = await client.multicall({ contracts });

      results.forEach((result, index) => {
        const contract = batch[index];
        if (result.status === 'success') {
          // Disabled serialization because result can be any complex struct/object, not necessarily string or number
          // resultsMap.set(contract.id, serializeBlockchainValue(result.result));
          resultsMap.set(contract.id, result.result);
        } else {
          resultsMap.set(contract.id, null);
          failedCalls.push({
            contract,
            error: result.error?.message || 'Unknown error',
          });
        }
      });
    } catch (error) {
      this.logger.error(
        `Error processing batch: ${error.message}`,
        error.stack,
      );
      batch.forEach((contract) => {
        resultsMap.set(contract.id, null);
        failedCalls.push({ contract, error: error.message });
      });
    }
  }
}
