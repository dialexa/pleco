import Knex from 'knex';

import * as dbGraphQLFilter from 'db-graphql-filter';

import { KnexQB } from './knexqb';

// We will override the functions
export * from 'db-graphql-filter';

const {
  getFilterQuery: getFilterQueryCore,
  getPageLimitOffsetQuery: getPLOffsetQueryCore,
  getSortQuery: getSortQueryCore
} = dbGraphQLFilter;

interface IGetFilterQueryArgs {
  filter: dbGraphQLFilter.IFilter;
  subqueries: Record<string, Knex.QueryBuilder>;
}

interface IGetSortQueryArgs {
  sort: dbGraphQLFilter.SortDirection;
  subqueries: Record<string, Knex.QueryBuilder>;
}

interface IContext {
  knex: Knex;
  queryBuilder: Knex.QueryBuilder;
}

interface IQbAndSubqueries {
  qb: KnexQB;
  subqueries: Record<string, KnexQB>;
}

const getQbAndSubqueries = (knexSubqueries: IGetFilterQueryArgs['subqueries'], context: IContext): IQbAndSubqueries => {
  const qb = new KnexQB({ query: context.queryBuilder });
  const subqueries = KnexQB.bulkCreateQueries(context.knex, knexSubqueries);

  return { qb, subqueries };
}

export const getFilterQuery = (args: IGetFilterQueryArgs, context: IContext): Knex.QueryBuilder => {
  const { qb, subqueries } = getQbAndSubqueries(args.subqueries, context);

  return getFilterQueryCore({ ...args, subqueries }, qb).build();
};

export const getPageLimitOffsetQuery = (page: dbGraphQLFilter.ILimitOffsetPage, context: IContext): Knex.QueryBuilder => {
  const { qb } = getQbAndSubqueries({}, context);

  return getPLOffsetQueryCore(page, qb).build();
};

export const getSortQuery = (args: IGetSortQueryArgs, context: IContext): Knex.QueryBuilder => {
  const { qb, subqueries } = getQbAndSubqueries(args.subqueries, context)

  return getSortQueryCore({ ...args, subqueries }, qb).build();
}
