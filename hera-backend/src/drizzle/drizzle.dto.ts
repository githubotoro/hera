import {
  IsString,
  IsOptional,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import {
  Filter,
  FilterJoin,
  Sorting,
  Page,
  RequestPage,
  ResponsePage,
  SqlFilter,
  SqlSorting,
} from './drizzle.types';

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

export class FilterDto implements Filter {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  value: string | number | boolean | string[] | number[];

  @IsOptional()
  @IsIn([
    'eq',
    'ne',
    'neq',
    'gt',
    'gte',
    'lt',
    'lte',
    'in',
    'notIn',
    'isNull',
    'isNotNull',
  ])
  condition?: FilterCondition;

  @IsOptional()
  @IsIn(['and', 'or'])
  join?: FilterJoin;
}

export class SortingDto implements Sorting {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsOptional()
  @IsBoolean()
  desc?: boolean;
}

export class PageDto implements Partial<Page> {
  @IsNumber()
  @IsNotEmpty()
  index: number;

  @IsNumber()
  @IsNotEmpty()
  size: number;

  @IsNumber()
  @IsOptional()
  total?: number;
}

export class BaseRequestBody {
  filters?: Filter[] | SqlFilter[];

  searchKey?: string;

  sorting?: Sorting[] | SqlSorting[];

  page?: RequestPage;
}

export class BasePaginationResponse {
  page: ResponsePage;

  count: number;
}
