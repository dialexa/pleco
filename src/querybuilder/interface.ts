import Knex from 'knex';

import { GraphQLFilterTypes, SortDirection } from 'src/types';

type QueryCallback<T> = (builder: IQueryBuilder<T>) => IQueryBuilder<T>;

// Minimalist QueryBuilder with only what we need
export interface IQueryBuilder<T> {
  select(raw: string): IQueryBuilder<T>;
  from(raw: string): IQueryBuilder<T>;

  leftJoin(raw: string, column1: string, column2: string): IQueryBuilder<T>;

  whereIn(column: string, values: GraphQLFilterTypes[]): IQueryBuilder<T>;
  whereNotIn(column: string, values: GraphQLFilterTypes[]): IQueryBuilder<T>;

  whereNull(column: string): IQueryBuilder<T>;
  whereNotNull(column: string): IQueryBuilder<T>;

  where(column: string, operator: string, value: GraphQLFilterTypes): IQueryBuilder<T>;
  where(callback: QueryCallback<T>): IQueryBuilder<T>;

  andWhere(callback: QueryCallback<T>): IQueryBuilder<T>;
  orWhere(callback: QueryCallback<T>): IQueryBuilder<T>;

  orderBy(field: string, direction: SortDirection): IQueryBuilder<T>;

  limit(lim: number): IQueryBuilder<T>;
  offset(offt: number): IQueryBuilder<T>;

  build(): T;
}

export type SupportedQueryBuilder = Knex.QueryBuilder;
