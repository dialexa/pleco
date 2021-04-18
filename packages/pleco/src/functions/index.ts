/**
 * Functions for dealing with filtering and sorting.
 *
 * These functions rely on a dictionary of subqueries for
 * custom fields. These subqueries have a specific format they
 * must follow.
 *
 * 1. It is recommended for the subquery result to have as many rows as rows in the base table.
 *    This means defining defaults or setting some values as NULL. An example of this is calculating
 *    survey mood for users. Not all users have surveys, but if they do not have any surveys, they
 *    should still have what we consider to be "neutral" survey mood. When filtering by neutral survey
 *    mood, if we do not include these NULL rows, then we will miss these users.
 * 2. All subqueries must return the following columns named exactly like this:
 *      - resource_id: the id of the resource being queried i.e. the id column.
 *      - value: the value that is being matched against the filter for the resource with the resource_id
 *      - sort: the value that is used to determine sort order (often the same as value). If you know that
 *              you will not be sorting using this subquery, there is no need to have the sort column
 * 3. Every field that is passed in to the filter function should have a subquery associated with it. If there
 *    are fields that do not have any subqueries that you need to filter by, this must be handled outside of
 *    the filter library.
 */

import { v4 as uuidv4 } from 'uuid';

import {
  IQueryBuilder,
} from '../querybuilder';
import {
  IFilter,
  IFilterAND,
  IFilterOR,
  ILimitOffsetPage,
  INestedFilter,
  ISort,
} from '../types';

interface IGetFilterQueryArgs<Q> {
  filter: IFilter | INestedFilter;
  subqueries: Record<string, IQueryBuilder<Q>>;
}

interface IGetSortQueryArgs<Q> {
  sort: ISort;
  subqueries: Record<string, IQueryBuilder<Q>>;
}

/**
 * Handles filtering
 *
 * @param args the object containing the filter and the subqueries for those filters
 * @param query the query builder to build off of
 * @param valueCol the name of the column to use for the value to filter on
 */
export const getFilterQuery = <Q>(
  args: IGetFilterQueryArgs<Q>,
  query: IQueryBuilder<Q>,
  valueCol = 'value',
): IQueryBuilder<Q> => {
  const { filter, subqueries } = args;
  if (!filter) return query;

  let operator = undefined;
  // implicit AND
  if (Object.keys(filter).length > 1) operator = 'AND';
  else operator = Object.keys(filter)[0];
  if (!operator) return query;

  if (operator === 'AND') {
    /*
     * Convert implicit AND to regular AND syntax
     *
     * AND: { key1: { ... }, key2: { ... }, ... }
     * AND: [ { key1: { ... }, { key2: { ... }, ...]
     */
    const andFilter = filter as IFilterAND;
    const andArray: Array<IFilter | INestedFilter> = andFilter.hasOwnProperty('AND') ? andFilter.AND as IFilter[] :
      Object.entries(andFilter).map(([k, v]: [string, INestedFilter]) => ({ [k]: v }));

    andArray.map((f) => {
      query.where((builder) =>
        getFilterQuery({ filter: f, subqueries }, builder, valueCol),
      );
    });

    return query;
  }

  if (operator === 'OR') {
    ((filter as IFilterOR).OR).map((f) => {
      query.orWhere((builder) =>
        getFilterQuery({ filter: f, subqueries }, builder, valueCol),
      );
    });

    return query;
  }

  const parameter = filter[operator];

  switch (operator) {
    case 'in':
      query.whereIn(valueCol, parameter);
      break;
    case 'nin':
      query.whereNotIn(valueCol, parameter);
      break;
    case 'eq':
      if (parameter === null) query.whereNull(valueCol);
      else query.where(valueCol, '=', parameter);
      break;
    case 'gt':
      query.where(valueCol, '>', parameter);
      break;
    case 'lt':
      query.where(valueCol, '<', parameter);
      break;
    case 'gte':
      query.where(valueCol, '>=', parameter);
      break;
    case 'lte':
      query.where(valueCol, '<=', parameter);
      break;
    case 'ne':
      if (parameter === null) query.whereNotNull(valueCol);
      else query.where(valueCol, '!=', parameter);
      break;
    case 'contains':
      query.whereRaw('lower(??) like ?', [valueCol, `%${parameter.toLowerCase()}%`]);
      break;
    default:
      let subfilter = {};

      // implicit IN
      if (Array.isArray(filter[operator])) subfilter = { in: parameter };
      // regular filter
      else if (typeof filter[operator] === 'object') subfilter = filter[operator];
      // implicit eq
      else if (['string', 'number', 'boolean'].includes(typeof filter[operator])) subfilter = { eq: parameter };
      else throw new Error(`Error parsing filter. Type ${typeof filter[operator]} is not supported`);

      if (!subqueries || !subqueries[operator]) {
        // if there's no subquery, assume it's just a column on the table
        query.where((builder) => getFilterQuery({ filter: subfilter, subqueries }, builder, operator));
      } else {
        // Get the subquery
        const subquery = subqueries[operator].clone();
        const whereInQuery = query.getNewInstance();
        query.whereIn('id',
          whereInQuery.select('resource_id')
            .from(subquery.as(`subquery_${operator}__${uuidv4()}`)) // to avoid clashing subquery names
            .where((builder) => getFilterQuery({ filter: subfilter, subqueries }, builder, valueCol)),
        );
      }

      break;
  }

  return query;
};

/**
 * Handles sorting
 *
 * This function wraps around the existing query and joins with the sorting subquery and orders by the sort column
 * of the sorting subquery. The reason for this is because queries that select DISTINCT will not work by just
 * doing a join, without selecting the sort column as well.
 *
 * @param args the object containing the specified sort and the subqueries for the sort field
 * @param qb the query builder to build off of
 */
export const getSortQuery = <Q>(
  args: IGetSortQueryArgs<Q>,
  query: IQueryBuilder<Q>,
): IQueryBuilder<Q> => {
  const { sort, subqueries } = args;
  if (!sort) return query;

  const field = Object.keys(sort)[0];
  if (!field) return query;

  const order = sort[field];

  if (!subqueries || !subqueries[field]) {
    // assume it's just a column on the query
    return query.orderBy(field, order);
  }

  const sortSubquery = subqueries[field];
  const wrapperQuery = query.getNewInstance();

  return wrapperQuery
    .select('subquery.*')
    .from(query.as('subquery'))
    .leftJoin(sortSubquery.as('subquery_sort'), 'subquery.id', 'subquery_sort.resource_id')
    .orderBy('subquery_sort.sort', order);
};

/**
 * Handles paginating based on limit and offset
 *
 * @param page the page options
 * @param qb the query builder to build off of
 */
export const getPageLimitOffsetQuery = <Q>(
  page: ILimitOffsetPage,
  query: IQueryBuilder<Q>,
): IQueryBuilder<Q> => {
  if (!page) return query;

  const defaults = {
    offset: 0,
  };

  const options = { ...defaults, ...page };

  query.offset(options.offset);
  if (options.limit !== undefined) query.limit(options.limit);

  return query;
};
