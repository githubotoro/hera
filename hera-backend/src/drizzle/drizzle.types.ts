import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AnyColumn } from 'drizzle-orm';

export type FilterCondition =
  | 'eq'
  | 'ne'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'inArray'
  | 'notInArray'
  | 'in'
  | 'notIn'
  | 'isNull'
  | 'isNotNull';

export type FilterJoin = 'and' | 'or';

export type FilterValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | null;

export class Filter {
  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty({
    oneOf: [
      { type: 'string' },
      { type: 'number' },
      { type: 'boolean' },
      { type: 'string[]' },
      { type: 'number[]' },
      { type: 'null' },
    ],
  })
  value: FilterValue;

  @ApiProperty({
    oneOf: [
      { type: 'eq' },
      { type: 'ne' },
      { type: 'neq' },
      { type: 'gt' },
      { type: 'gte' },
      { type: 'lt' },
      { type: 'lte' },
      { type: 'inArray' },
      { type: 'notInArray' },
      { type: 'in' },
      { type: 'notIn' },
      { type: 'isNull' },
      { type: 'isNotNull' },
    ],
  })
  @IsOptional()
  condition?: FilterCondition;

  @ApiProperty({
    oneOf: [{ type: 'and' }, { type: 'or' }],
  })
  @IsOptional()
  join?: FilterJoin;
}

export class SqlFilter extends Filter {
  column: AnyColumn;
}

export class Sorting {
  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty({
    type: Boolean,
  })
  desc?: boolean;
}

export class SqlSorting extends Sorting {
  column: AnyColumn;
}

export class Page {
  @ApiProperty({
    type: Number,
  })
  index: number;

  @ApiProperty({
    type: Number,
  })
  size: number;

  @ApiProperty({
    type: Number,
  })
  total: number;
}

export class RequestPage {
  @ApiProperty({
    type: Number,
  })
  @IsOptional()
  index: number;

  @ApiProperty({
    type: Number,
  })
  @IsOptional()
  size: number;
}

export class ResponsePage {
  @ApiProperty({
    type: Number,
  })
  index: number;

  @ApiProperty({
    type: Number,
  })
  size: number;

  @ApiProperty({
    type: Number,
  })
  total: number;
}
