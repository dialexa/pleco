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

import Knex from 'knex';

import {
  IQueryBuilder,
  KnexQB,
} from 'src/querybuilder';
import {
  IFilter,
  IFilterAND,
  IFilterOR,
  ILimitOffsetPage,
  limitOffsetPageDefault,
  SortDirection,
} from 'src/types';

/*
Example Filter for user:
{
  AND: [{
    numberOfHouses: { gt: 0 }
  }, {
    OR: [{
      firstName: { AND: [{ contains: 'rand' }, { ne: 'Brand' }] }
    }, {
      lastName: { eq: 'Kuo' }
    }]
  }]
}

SQL for example:
select * from users
where
  id in (select id from numberOfHousesSubquery where value > 0) and
  (id in (select id from usersFirstNameSubQuery where lower(value) like '%rand%' and value != 'Brand') or
   id in (select id from usersLastNameSubQuery where value = 'Kuo'))
 */

/*
 * TODO: analyze whether or not is is quicker to use CTEs and analyze the filter ahead of time or continue
 * to use subqueries
 */

/**
 * Handles filters
 *
 * @param knex the instance of Knex to use for raw queries
 * @param qb the query builder to build off of
 * @param filter the filter object
 * @param subqueries the map of subqueries for handling filter fields
 */
export const formFilterQuery = (
  knex: Knex,
  qb: Knex.QueryBuilder,
  filter: IFilter,
  subqueries: Record<string, Knex.QueryBuilder>,
): Knex.QueryBuilder => {
  const query = qb.clone();
  if (!filter) return query;

  const operator = Object.keys(filter)[0];
  if (!operator) return query;

  if (operator === 'AND') {
    ((filter as IFilterAND).AND).map(f => {
      query.where(builder => {
        builder = formFilterQuery(knex, builder, f, subqueries);
      });
    });

    return query;
  } else if (operator === 'OR') {
    ((filter as IFilterOR).OR).map(f => {
      query.orWhere(builder => {
        builder = formFilterQuery(knex, builder, f, subqueries);
      });
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
      query.where(knex.raw('lower(value) like ?', `%${parameter.toLowerCase()}%`));
      break;
    default: // Referencing a field
      if (!subqueries[operator]) throw new Error(`Error forming filter query: missing subquery for ${operator}`);

      // Get the subquery
      const subquery = subqueries[operator].clone();
      query.whereIn('id',
        knex.select('resource_id')
        .from(subquery.as(`subquery_${operator}__${generateRandomNumber()}`)) // to avoid clashing subquery names
        .where(builder => {
          builder = formFilterQuery(knex, builder, filter[operator], subqueries);
        })
      );
      break;
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
 * @param knex the instance of Knex
 * @param qb the query builder to wrap as a subquery
 * @param sort the sort object which specifies the field and direction
 * @param subqueries the map of subqueries for handling sort fields
 */
export const getSortQuery = (
  knex: Knex,
  qb: Knex.QueryBuilder,
  sort: Record<string, SortDirection>,
  subqueries: Record<string, Knex.QueryBuilder>,
): Knex.QueryBuilder => {
  const query = qb.clone();
  if (!sort) return query;

  const field = Object.keys(sort)[0];
  if (!field) return query;

  const order = sort[field];
  const sortSubquery = subqueries[field];

  if (!sortSubquery) throw new Error(`Error forming sort query: missing subquery for ${field}`);

  return knex
    .select('subquery.*')
    .from(query.as('subquery'))
    .leftJoin(sortSubquery.as('subquery_sort'), 'subquery.id', 'subquery_sort.resource_id')
    .orderBy('subquery_sort.sort', order);
};

/**
 * Handles paginating based on limit and offset
 *
 * @param knex the instance of knex
 * @param qb the query to build off of
 * @param page the page options
 */
export const formPageLimitOffsetQuery = <S>(
  qb: S,
  qbType: string,
  page: ILimitOffsetPage
): S => {
  const query = getQueryBuilder(qb, qbType);
  if (!page || !page.limit) return query.build();

  const options = { ...limitOffsetPageDefault, ...page };

  query.limit(options.limit).offset(options.offset);

  return query.build();
};

const getQueryBuilder = <S>(qb: S, type: string): IQueryBuilder<S> => {
  switch (type) {
    case 'knex': return new KnexQB(qb);
    default: return null;
  }
};
const generateRandomNumber = () => Math.floor(Math.random() * 1000);
