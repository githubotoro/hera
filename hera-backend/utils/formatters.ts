import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { SafeBigInt } from './parsers';

export const RawAmount = (
  value: string | number | bigint | undefined | null,
  decimals?: number,
) => {
  const ethersFormatter = new EthersFormatter();
  return ethersFormatter.rawAmount({ value, decimals });
};

export const TokenAmount = (
  value: string | number | bigint | undefined | null,
  decimals?: number,
  price?: number,
) => {
  const ethersFormatter = new EthersFormatter();
  return ethersFormatter.tokenAmount({ value, decimals, price });
};

export class EthersFormatter {
  rawAmount({
    value,
    decimals,
  }: {
    value: string | number | bigint | undefined | null;
    decimals?: number;
  }) {
    try {
      if (!value) return SafeBigInt('0').toString();

      // If decimals are provided, that means the value is tokenAmount and therefore we need to convert it to rawAmount
      if (decimals) {
        return ethers
          .parseUnits(parseFloat(value.toString()).toFixed(decimals), decimals)
          .toString();
      }

      return SafeBigInt(value).toString();
    } catch (error) {
      return SafeBigInt('0').toString();
    }
  }

  tokenAmount({
    value,
    decimals,
    price,
  }: {
    value: string | number | bigint | undefined | null;
    decimals?: number;
    price?: number;
  }) {
    try {
      if (!value) return 0;

      let tokenAmount = 0;

      // If decimals are provided, that means the value is rawAmount and therefore we need to convert it to tokenAmount
      if (decimals) {
        tokenAmount = parseFloat(
          ethers.formatUnits(SafeBigInt(value), decimals),
        );
      }

      if (isNaN(tokenAmount)) return 0;

      // If price is provided, then return tokenAmountUsd
      if (price !== undefined && price !== null) {
        return tokenAmount * price;
      }

      return tokenAmount;
    } catch (error) {
      return 0;
    }
  }
}
