import { GraphQLFilterTypes, SortDirection } from 'src/types';

type QueryCallback<T> = (builder: IQueryBuilder<T>) => IQueryBuilder<T>;

// Minimalist QueryBuilder with only what we need
export interface IQueryBuilder<T> {
  select(raw: string): IQueryBuilder<T>;
  from(table: string): IQueryBuilder<T>;
  from(raw: IQueryBuilder<T>): IQueryBuilder<T>;
  as(name: string): IQueryBuilder<T>;

  leftJoin(table: string, column1: string, column2: string): IQueryBuilder<T>;
  leftJoin(raw: IQueryBuilder<T>, column1: string, column2: string): IQueryBuilder<T>;

  whereIn(column: string, values: GraphQLFilterTypes[]): IQueryBuilder<T>;
  whereIn(column: string, raw: IQueryBuilder<T>): IQueryBuilder<T>;
  whereNotIn(column: string, values: GraphQLFilterTypes[]): IQueryBuilder<T>;
  whereNotIn(column: string, raw: IQueryBuilder<T>): IQueryBuilder<T>;

  whereNull(column: string): IQueryBuilder<T>;
  whereNotNull(column: string): IQueryBuilder<T>;

  where(column: string, operator: string, value: GraphQLFilterTypes): IQueryBuilder<T>;
  where(callback: QueryCallback<T>): IQueryBuilder<T>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  whereRaw(query: string, bindings?: any[]): IQueryBuilder<T>;

  orWhere(callback: QueryCallback<T>): IQueryBuilder<T>;

  orderBy(field: string, direction: SortDirection): IQueryBuilder<T>;

  limit(lim: number): IQueryBuilder<T>;
  offset(offt: number): IQueryBuilder<T>;

  getNewInstance(): IQueryBuilder<T>;
  clone(): IQueryBuilder<T>;
  build(): T;
}
