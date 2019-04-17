import { GraphQLFilterTypes, SortDirection } from '../types';

type QueryCallback<T> = (builder: T) => void;
type Raw = any; // TODO: figure out how to enforce this type

// Minimalist QueryBuilder with only what we need
export interface IQueryBuilder<T> {
  select(raw: string): this;
  from(table: string): this;
  from(raw: Raw): this;
  as(name: string): this;

  leftJoin(table: string, column1: string, column2: string): this;
  leftJoin(raw: Raw, column1: string, column2: string): this;

  whereIn(column: string, values: GraphQLFilterTypes[]): this;
  whereIn(column: string, raw: Raw): this;
  whereNotIn(column: string, values: GraphQLFilterTypes[]): this;
  whereNotIn(column: string, raw: Raw): this;

  whereNull(column: string): this;
  whereNotNull(column: string): this;

  where(column: string, operator: string, value: GraphQLFilterTypes): this;
  where(callback: QueryCallback<this>): this;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  whereRaw(query: string, bindings?: any[]): this;

  orWhere(callback: QueryCallback<this>): this;

  orderBy(field: string, direction: SortDirection): this;

  limit(lim: number): this;
  offset(offt: number): this;

  getNewInstance(): this;
  clone(): this;
  build(): T;
}
