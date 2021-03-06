import { Knex } from 'knex';
import _ from 'lodash';

import { KnexQB } from '@dialexa/pleco-knex';

type TransformFunction<T> = (_: T | T[]) => T | T[];

function transform<T>(data: T, func: TransformFunction<T>): T;
function transform<T>(data: T[], func: TransformFunction<T>): T[];

function transform<T>(data: T | T[], func: TransformFunction<T>): T | T[] {
  if (!data) {
    return data;
  } else if (Array.isArray(data)) {
    return data.map((elem) => transform(elem, func));
  } else if (typeof data === 'object') {
    return _.mapKeys(data, (value, key) => transform(key, func));
  }
  return func(data);

}

export function camelCase<T>(data: T): T;
export function camelCase<T>(data: T[]): T[];

export function camelCase<T>(data: T | T[]): T | T[] {
  return transform(data, _.camelCase);
}

export function snakeCase<T>(data: T): T;
export function snakeCase<T>(data: T[]): T[];

export function snakeCase<T>(data: T | T[]): T | T[] {
  return transform(data, _.snakeCase);
}

export const getSubqueries = async (
  table: string,
  knex: Knex,
  subqueries: Record<string, Knex.QueryBuilder> = {},
): Promise<Record<string, KnexQB>> => {
  const columnNames = await knex(table).columnInfo().then(Object.keys);
  const columnSubqueries: Record<string, Knex.QueryBuilder> = {};
  columnNames.forEach((column) => {
    columnSubqueries[camelCase(column)] = knex(table).select(
      'id as resource_id',
      knex.raw('?? as value', column),
      knex.raw('?? as sort', column),
    );
  });

  return KnexQB.bulkCreateQueries(knex, {
    ...columnSubqueries,
    ...subqueries,
  });
};

export const knexConfig = {
  client: 'pg',
  pool: {
    min: 2,
    max: 10,
  },
  connection: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || '',
    database: process.env.POSTGRES_DB || 'pleco_test',
  },
};

export const expectedIds = (arr: Array<{ id: string }>, indices: number[]): string[] => indices.map((i) => arr[i].id);
