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

import Chance from 'chance';

import {
  IQueryBuilder,
} from '../querybuilder';
import {
  IFilter,
  IFilterAND,
  IFilterOR,
  ILimitOffsetPage,
  limitOffsetPageDefault,
  SortDirection,
} from '../types';

interface IGetFilterQueryArgs<Q> {
  filter: IFilter;
  subqueries: Record<string, IQueryBuilder<Q>>;
}

interface IGetSortQueryArgs<Q> {
  sort: SortDirection;
  subqueries: Record<string, IQueryBuilder<Q>>;
}

const random = new Chance();

/**
 * Handles filtering
 *
 * @param args the object containing the filter and the subqueries for those filters
 * @param qb the query builder to build off of
 */
export const getFilterQuery = <Q>(
  args: IGetFilterQueryArgs<Q>,
  query: IQueryBuilder<Q>,
): IQueryBuilder<Q> => {
  const { filter, subqueries } = args;
  if (!filter) return query;

  const operator = Object.keys(filter)[0];
  if (!operator) return query;

  if (operator === 'AND') {
    ((filter as IFilterAND).AND).map(f => {
      query.where(builder =>
        getFilterQuery({ filter: f, subqueries }, builder)
      );
    });

    return query;
  }

  if (operator === 'OR') {
    ((filter as IFilterOR).OR).map(f => {
      query.orWhere(builder =>
        getFilterQuery({ filter: f, subqueries }, builder)
      );
    });

    return query;
  }

  const parameter = filter[operator];

  switch (operator) {
    case 'in':
      query.whereIn('value', parameter);
      break;
    case 'nin':
      query.whereNotIn('value', parameter);
      break;
    case 'eq':
      if (parameter === null) query.whereNull('value');
      else query.where('value', '=', parameter);
      break;
    case 'gt':
      query.where('value', '>', parameter);
      break;
    case 'lt':
      query.where('value', '<', parameter);
      break;
    case 'gte':
      query.where('value', '>=', parameter);
      break;
    case 'lte':
      query.where('value', '<=', parameter);
      break;
    case 'ne':
      if (parameter === null) query.whereNotNull('value');
      else query.where('value', '!=', parameter);
      break;
    case 'contains':
      query.whereRaw('lower(value) like ?', [`%${parameter.toLowerCase()}%`]);
      break;
    default: { // Referencing a field
      if (!subqueries[operator]) throw new Error(`Error forming filter query: missing subquery for ${operator}`);

      // Get the subquery
      const subquery = subqueries[operator].clone();
      const whereInQuery = query.getNewInstance();
      query.whereIn('id',
        whereInQuery.select('resource_id')
          .from(subquery.as(`subquery_${operator}__${random.guid()}`)) // to avoid clashing subquery names
          .where(builder =>  getFilterQuery({ filter: filter[operator], subqueries }, builder))
      );
      break;
    }
  }

  return query;
};

/**
 * Handles sorting
 *
 * This function wraps around the existing query and joins with the soriting subquery and orders by the sort column
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
  const sortSubquery = subqueries[field];

  if (!sortSubquery) throw new Error(`Error forming sort query: missing subquery for ${field}`);

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
  if (!page || !page.limit) return query;

  const options = { ...limitOffsetPageDefault, ...page };

  return query.limit(options.limit).offset(options.offset);
};
