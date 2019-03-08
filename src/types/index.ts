// The Typescript types that cover the GraphQL Scalars
export type GraphQLFilterTypes = string | number;
// The strings of the GraphQL Scalars
export type GraphQLFilterScalar = 'ID' | 'String' | 'Int' | 'Float';

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
  { AND: Array<IFilterQuery<T>>; } |
  { OR: Array<IFilterQuery<T>>; };

export type IFilterQueryFields<T extends GraphQLFilterTypes> =
  { in: T[]; } |
  { nin: T[]; } |
  { eq: T; } |
  { gt: T; } |
  { lt: T; } |
  { gte: T; } |
  { lte: T; } |
  { ne: T; } |
  { contains: T; };

export type IFilterQuery<T extends GraphQLFilterTypes> = IFilterQueryANDOR<T> | IFilterQueryFields<T>;

export type SortDirection = 'ASC' | 'DESC';

export const limitOffsetPageDefault = {
  limit: 0,
  offset: 0,
};

export interface ILimitOffsetPage {
  limit: number;
  offset: number;
}
