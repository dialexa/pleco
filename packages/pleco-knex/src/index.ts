import Knex from 'knex';

import * as dbQuery from 'pleco';

import { IConstructorArgs, KnexQB } from './knexqb';

// We will override the functions
export * from 'pleco';
export { KnexQB };

const {
  getFilterQuery: getFilterQueryCore,
  getPageLimitOffsetQuery: getPLOffsetQueryCore,
  getSortQuery: getSortQueryCore,
} = dbQuery;

interface IGetFilterQueryArgs {
  filter: dbQuery.IFilter;
  subqueries: Record<string, Knex.QueryBuilder>;
}

interface IGetSortQueryArgs {
  sort: dbQuery.ISort;
  subqueries: Record<string, Knex.QueryBuilder>;
}

interface IQbAndSubqueries {
  qb: dbQuery.IQueryBuilder<Knex.QueryBuilder>;
  subqueries: Record<string, dbQuery.IQueryBuilder<Knex.QueryBuilder>>;
}

type IContext = IConstructorArgs;

const getQbAndSubqueries = (knexSubqueries: IGetFilterQueryArgs['subqueries'], context: IContext): IQbAndSubqueries => {
  const qb = new KnexQB(context);
  const subqueries = KnexQB.bulkCreateQueries(context.knex, knexSubqueries);

  return { qb, subqueries };
};

export const getFilterQuery = (args: IGetFilterQueryArgs, context: IContext): Knex.QueryBuilder => {
  const { qb, subqueries } = getQbAndSubqueries(args.subqueries, context);

  return getFilterQueryCore({ ...args, subqueries }, qb).build();
};

export const getPageLimitOffsetQuery = (page: dbQuery.ILimitOffsetPage, context: IContext): Knex.QueryBuilder => {
  const { qb } = getQbAndSubqueries({}, context);

  return getPLOffsetQueryCore(page, qb).build();
};

export const getSortQuery = (args: IGetSortQueryArgs, context: IContext): Knex.QueryBuilder => {
  const { qb, subqueries } = getQbAndSubqueries(args.subqueries, context);

  return getSortQueryCore({ ...args, subqueries }, qb).build();
};
