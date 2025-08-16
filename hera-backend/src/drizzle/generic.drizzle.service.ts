import { Injectable, Logger } from '@nestjs/common';
import {
  and,
  getTableColumns,
  or,
  ne,
  SQL,
  sql,
  eq,
  gt,
  gte,
  lt,
  lte,
  desc,
  asc,
  AnyColumn,
  inArray,
  notInArray,
  InferSelectModel,
  isNull,
  isNotNull,
} from 'drizzle-orm';
import { DrizzleService } from './drizzle.service';
import { IndexColumn, PgSelect, PgTable } from 'drizzle-orm/pg-core';
import { RequestPage, SqlFilter, SqlSorting } from './drizzle.types';

@Injectable()
export class GenericDrizzleService {
  private readonly logger = new Logger(GenericDrizzleService.name);
  private readonly BATCH_SIZE = 1000;

  constructor(private readonly db: DrizzleService) {}

  async batchProcess<T, R = any>({
    items,
    batchSize = this.BATCH_SIZE,
    processor,
  }: {
    items: T[];
    batchSize?: number;
    processor: (batch: T[]) => Promise<R>;
  }): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      if (batchResults && Array.isArray(batchResults)) {
        results.push(...batchResults);
      }
    }

    return results;
  }

  async fetchAllPages<T>({
    query,
    limit = 1000,
  }: {
    query: (limit: number, offset: number) => Promise<T[]>;
    limit?: number;
  }): Promise<T[]> {
    let results: T[] = [];
    let offset = 0;

    while (true) {
      const batch = await query(limit, offset);
      if (batch.length === 0) break;

      results = [...results, ...batch];
      offset += limit;
    }

    return results;
  }

  convertToMap<T extends Record<string, any>, C extends keyof T>({
    rows,
    columnName,
  }: {
    rows: T[];
    columnName: C | C[];
  }): Map<string, T> {
    const resultMap = new Map<string, T>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const key: string = Array.isArray(columnName)
        ? columnName.map((c) => row[c]).join('_')
        : row[columnName].toString();

      resultMap.set(key, row);
    }

    return resultMap;
  }

  convertToArrayMap<T extends Record<string, any>, C extends keyof T>({
    rows,
    columnName,
  }: {
    rows: T[];
    columnName: C | C[];
  }): Map<string, T[]> {
    const resultMap = new Map<string, T[]>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      const key: string = Array.isArray(columnName)
        ? columnName.map((c) => row[c]).join('_')
        : row[columnName].toString();

      if (!resultMap.has(key)) {
        resultMap.set(key, []);
      }

      resultMap.get(key)?.push(row);
    }

    return resultMap;
  }

  buildConflictUpdateColumns = <
    T extends PgTable,
    Q extends keyof T['_']['columns'],
  >(
    table: T,
    columns: Q[],
  ) => {
    const cls = getTableColumns(table);

    return columns.reduce(
      (acc, column) => {
        if (!cls[column] || !cls[column].name) return acc;

        const colName = cls[column].name;
        acc[column] = sql.raw(`excluded.${colName}`);
        return acc;
      },
      {} as Record<Q, SQL>,
    );
  };

  numericToString = (value: any) => {
    return value.toLocaleString('fullwide', { useGrouping: false });
  };

  getViewColumns<T extends { [key: string]: any }>(
    view: T,
  ): { [key: string]: AnyColumn } {
    return Object.fromEntries(
      Object.entries(view).filter(([_, value]) => 'name' in value),
    ) as { [key: string]: AnyColumn };
  }

  async upsert<
    T extends PgTable,
    I extends IndexColumn | IndexColumn[],
    R extends Record<string, any>,
  >({
    table,
    target,
    rows,
    batchSize = this.BATCH_SIZE,
  }: {
    table: T;
    target: I;
    rows: R[];
    batchSize?: number;
  }): Promise<InferSelectModel<T>[]> {
    if (rows.length === 0) return [];

    const targetArray: IndexColumn[] = Array.isArray(target)
      ? (target as IndexColumn[])
      : [target as IndexColumn];

    const targetColumnNames = targetArray.map((t) => t.name);

    const conflictColumns = Object.keys(rows[0]).filter(
      (key) => !targetColumnNames.includes(key),
    );

    return this.batchProcess<R, any>({
      items: rows,
      batchSize,
      processor: async (batch) => {
        if (batch.length === 0) return [];

        const result = await this.db.write
          .insert(table)
          .values(batch)
          .onConflictDoUpdate({
            target: targetArray,
            set: this.buildConflictUpdateColumns(table, conflictColumns),
          })
          .returning();

        return result as InferSelectModel<T>[];
      },
    });
  }

  withFilters<T extends PgSelect>({
    qb,
    filters,
  }: {
    qb: T;
    filters: SqlFilter[];
  }) {
    let whereAndClauses: SQL[] = [];
    let whereOrClauses: SQL[] = [];

    for (const filter of filters) {
      if (filter.id.includes('.')) {
        // Split the path into parts
        const pathParts = filter.id.split('.');
        const jsonColumnName = pathParts[0]; // e.g., 'marketMetadata'

        // Find the actual column object
        const column = this.findColumnByName({
          qb,
          columnName: jsonColumnName,
        });

        if (column) {
          // Use the jsonExtract function to handle nested JSON paths
          const jsonPath = pathParts.slice(1).join('.');

          const extractedValue = this.jsonExtract(column, jsonPath);

          // Handling nested JSON conditions, currently only supports equality
          if (!filter.join || filter.join === 'and') {
            whereAndClauses.push(sql`${extractedValue} = ${filter.value}`);
          } else {
            whereOrClauses.push(sql`${extractedValue} = ${filter.value}`);
          }
        }
      } else {
        const column = filter.column;

        if (!filter.condition) {
          if (!filter.join || filter.join === 'and') {
            whereAndClauses.push(eq(column, filter.value));
          } else {
            whereOrClauses.push(eq(column, filter.value));
          }
        } else if (filter.condition === 'isNull') {
          if (!filter.join || filter.join === 'and') {
            whereAndClauses.push(isNull(column));
          } else {
            whereOrClauses.push(isNull(column));
          }
        } else if (filter.condition === 'isNotNull') {
          if (!filter.join || filter.join === 'and') {
            whereAndClauses.push(isNotNull(column));
          } else {
            whereOrClauses.push(isNotNull(column));
          }
        } else if (filter.condition === 'ne') {
          if (!filter.join || filter.join === 'and') {
            whereAndClauses.push(ne(column, filter.value));
          } else {
            whereOrClauses.push(ne(column, filter.value));
          }
        } else if (filter.condition === 'neq') {
          if (!filter.join || filter.join === 'and') {
            whereAndClauses.push(ne(column, filter.value));
          } else {
            whereOrClauses.push(ne(column, filter.value));
          }
        } else if (filter.condition === 'gt') {
          if (!filter.join || filter.join === 'and') {
            whereAndClauses.push(gt(column, filter.value));
          } else {
            whereOrClauses.push(gt(column, filter.value));
          }
        } else if (filter.condition === 'lt') {
          if (!filter.join || filter.join === 'and') {
            whereAndClauses.push(lt(column, filter.value));
          } else {
            whereOrClauses.push(lt(column, filter.value));
          }
        } else if (filter.condition === 'gte') {
          if (!filter.join || filter.join === 'and') {
            whereAndClauses.push(gte(column, filter.value));
          } else {
            whereOrClauses.push(gte(column, filter.value));
          }
        } else if (filter.condition === 'lte') {
          if (!filter.join || filter.join === 'and') {
            whereAndClauses.push(lte(column, filter.value));
          } else {
            whereOrClauses.push(lte(column, filter.value));
          }
        } else if (
          filter.condition === 'inArray' &&
          Array.isArray(filter.value)
        ) {
          if (!filter.join || filter.join === 'and') {
            whereAndClauses.push(inArray(column, filter.value));
          } else {
            whereOrClauses.push(inArray(column, filter.value));
          }
        } else if (
          filter.condition === 'notInArray' &&
          Array.isArray(filter.value)
        ) {
          if (!filter.join || filter.join === 'and') {
            whereAndClauses.push(notInArray(column, filter.value));
          } else {
            whereOrClauses.push(notInArray(column, filter.value));
          }
        } else if (filter.condition === 'in') {
          if (!filter.join || filter.join === 'and') {
            whereAndClauses.push(sql`${filter.value} = ANY(${column})`);
          } else {
            whereOrClauses.push(sql`${filter.value} = ANY(${column})`);
          }
        } else if (filter.condition === 'notIn') {
          if (!filter.join || filter.join === 'and') {
            whereAndClauses.push(sql`${filter.value} != ALL(${column})`);
          } else {
            whereOrClauses.push(sql`${filter.value} != ALL(${column})`);
          }
        } else {
          whereAndClauses.push(eq(column, filter.value));
        }
      }
    }

    // @note - use this to log the final SQL query
    // this.logger.debug(
    //   'Final SQL Query:',
    //   (qb.where(and(...whereAndClauses)) as any).toSQL(),
    // );

    if (whereOrClauses.length === 0) {
      return whereAndClauses.length > 0
        ? qb.where(and(...whereAndClauses))
        : qb;
    }

    return whereAndClauses.length > 0
      ? qb.where(and(...whereAndClauses, or(...whereOrClauses)))
      : qb.where(or(...whereOrClauses));
  }

  findColumnByName({
    qb,
    columnName,
  }: {
    qb: any;
    columnName: string;
  }): AnyColumn | null {
    // Access the table configuration from the query builder
    const config = qb.config;
    if (!config || !config.table) return null;

    const table = config.table;

    // Try to access the columns from the table's internal properties
    try {
      // First try to access the columns directly from the table
      if (table.columns && table.columns[columnName]) {
        return table.columns[columnName];
      }

      // Then try to access the columns from the table's internal properties
      if (table._ && table._.columns && table._.columns[columnName]) {
        return table._.columns[columnName];
      }

      // If the column name contains dots, it might be a nested JSON field
      // In this case, we need to find the base column
      if (columnName.includes('.')) {
        const baseColumnName = columnName.split('.')[0];

        if (table.columns && table.columns[baseColumnName]) {
          return table.columns[baseColumnName];
        }

        if (table._ && table._.columns && table._.columns[baseColumnName]) {
          return table._.columns[baseColumnName];
        }
      }

      // Try to access the columns from the table's fields
      if (config.fields && config.fields[columnName]) {
        return config.fields[columnName];
      }
    } catch (error) {
      this.logger.warn(`Error accessing columns for ${columnName}:`, error);
    }

    return null;
  }

  withSorting<T extends PgSelect>({
    qb,
    sorting,
  }: {
    qb: T;
    sorting: SqlSorting[];
  }) {
    const orderByClauses = sorting.map((sort) => {
      return (sort.desc ?? true) ? desc(sort.column) : asc(sort.column);
    });

    return qb.orderBy(...orderByClauses);
  }

  withPagination<T extends PgSelect>({
    qb,
    page: { index = 1, size = 1 },
  }: {
    qb: T;
    page: {
      index?: number;
      size?: number;
    };
  }) {
    const safeIndex = Math.max(1, Math.floor(index));
    const safeSize = Math.max(1, Math.floor(size));

    const offset = Math.max(0, (safeIndex - 1) * safeSize);

    return qb.limit(safeSize).offset(offset) as T;
  }

  async buildGenericQuery<T extends PgSelect, C extends PgSelect>({
    baseQuery,
    countQuery,
    filters,
    sorting,
    page = { index: 1, size: 10 },
  }: {
    baseQuery: T;
    countQuery: C;
    filters: SqlFilter[];
    sorting: SqlSorting[];
    page: RequestPage | null;
  }) {
    // Apply filters to both queries
    if (filters.length > 0) {
      // Create new instances of the filters to avoid modifying the original
      const baseFilters = [...filters];
      const countFilters = [...filters];

      // Apply filters to base query
      baseQuery = this.withFilters({ qb: baseQuery, filters: baseFilters });

      // Apply filters to count query
      countQuery = this.withFilters({ qb: countQuery, filters: countFilters });

      // If the countQuery is still missing filters, apply them directly
      const baseQuerySQL = (baseQuery as any).toSQL().sql;
      const countQuerySQL = (countQuery as any).toSQL().sql;

      if (
        baseQuerySQL.includes('market_metadata') &&
        !countQuerySQL.includes('market_metadata')
      ) {
        // Directly copy the where clause from baseQuery to countQuery
        // @ts-expect-error - config is protected method of PgSelect
        countQuery.config.where = baseQuery.config.where;
      }
    }

    // Apply sorting to base query only
    if (sorting.length > 0) {
      baseQuery = this.withSorting({ qb: baseQuery, sorting });
    }

    // Apply pagination to base query only
    if (page) {
      baseQuery = this.withPagination({ qb: baseQuery, page });
    }

    // Set the count field for the count query
    // @ts-expect-error - config is protected method of PgSelect
    countQuery.config.fields = {
      count: sql<number>`count(*)`,
    };

    const [_data, _count] = await Promise.all([baseQuery, countQuery]);

    const count =
      Array.isArray(_count) && _count.length > 0
        ? parseInt(_count[0].count)
        : 0;

    const _page = {
      index: page?.index ?? 1,
      size: page?.size ?? 1,
      total: Math.ceil(count / (page?.size ?? 1)) || 1,
    };

    return {
      data: _data,
      count,
      page: _page,
    };
  }

  // Helper function to extract values from JSON columns
  jsonExtract(column: AnyColumn, path: string): SQL {
    // For text columns, we need to use a different approach
    // Use the ->> operator with a path array
    const parts = path.split('.');
    const pathArray = parts.map((part) => `'${part}'`).join(',');

    // Use the #>> operator with a path array
    return sql`(${column}::jsonb)#>>ARRAY[${sql.raw(pathArray)}]`;
  }
}
