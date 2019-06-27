// The Typescript types that cover the GraphQL Scalars
export type FilterType = string | number | boolean;

type StringNotAND = Exclude<string, 'AND'>;

export type IFilterAND = { [key in StringNotAND]: IFilter; } | { AND: IFilter[] };

export interface IFilterOR {
  OR: IFilter[];
}

export type IFilter =
  IFilterAND |
  IFilterOR |
  Record<string, IFilterQuery<FilterType>>;

export type IFilterQueryANDOR<T extends FilterType> =
  { AND: Array<IFilterQuery<T>> } |
  { OR: Array<IFilterQuery<T>> };

export type IFilterQueryFields<T extends FilterType> =
  T |
  T[] |
  { in: T[] } |
  { nin: T[] } |
  { eq: T } |
  { gt: T } |
  { lt: T } |
  { gte: T } |
  { lte: T } |
  { ne: T } |
  { contains: T };

export type IFilterQuery<T extends FilterType> = IFilterQueryANDOR<T> | IFilterQueryFields<T>;

export type SortDirection = 'ASC' | 'DESC';

export type ISort = Record<string, SortDirection>;

export interface ILimitOffsetPage {
  limit: number;
  offset: number;
}
