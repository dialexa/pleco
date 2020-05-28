// The Typescript types that cover the GraphQL Scalars
export type FilterType = string | number | boolean;

type StringNotAND = Exclude<string, 'AND'>;

export type IFilterAND = { [key in StringNotAND]: INestedFilter; } | { AND: IFilter[] };
interface INestedFilterAND { AND: INestedFilter[] }

export interface IFilterOR { OR: IFilter[] }
interface INestedFilterOR { OR: INestedFilter[] }

export type IFilter = IFilterAND | IFilterOR | Record<string, IFilterQuery<FilterType>>;
export type INestedFilter = INestedFilterAND | INestedFilterOR;

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
