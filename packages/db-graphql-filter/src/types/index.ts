// The Typescript types that cover the GraphQL Scalars
export type GraphQLFilterTypes = string | number;

export interface IFilterAND {
  AND: IFilter[];
}

export interface IFilterOR {
  OR: IFilter[];
}

export type IFilter =
  IFilterAND |
  IFilterOR |
  Record<string, IFilterQuery<GraphQLFilterTypes>>;

export type IFilterQueryANDOR<T extends GraphQLFilterTypes> =
  { AND: Array<IFilterQuery<T>> } |
  { OR: Array<IFilterQuery<T>> };

export type IFilterQueryFields<T extends GraphQLFilterTypes> =
  { in: T[] } |
  { nin: T[] } |
  { eq: T } |
  { gt: T } |
  { lt: T } |
  { gte: T } |
  { lte: T } |
  { ne: T } |
  { contains: T };

export type IFilterQuery<T extends GraphQLFilterTypes> = IFilterQueryANDOR<T> | IFilterQueryFields<T>;

export type SortDirection = 'ASC' | 'DESC';

export type ISort = Record<string, SortDirection>;


export interface ILimitOffsetPage {
  limit: number;
  offset: number;
}
