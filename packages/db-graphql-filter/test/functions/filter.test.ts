import { expect } from 'chai';
import Chance from 'chance';
import Knex from 'knex';

import { KnexQB } from 'db-graphql-filter-knex';

import { getFilterQuery } from 'src/functions';
import { expectedIds, getSubqueries, knexConfig, snakeCase } from 'test/helpers';

const random = new Chance();

describe('(Functions) Filter', () => {
  let knex: Knex;
  let vehicleSubqueries: Record<string, KnexQB>;

  const manufacturers = [
    {
      id: random.guid(),
      name: 'Nissan',
    },
    {
      id: random.guid(),
      name: 'Honda',
    },
  ];

  const vehicles = [
    {
      id: random.guid(),
      makeId: manufacturers[0].id,
      model: 'Altima',
      year: 2014,
    },
    {
      id: random.guid(),
      makeId: manufacturers[0].id,
      model: 'Altima',
      year: 2015,
    },
    {
      id: random.guid(),
      makeId: manufacturers[0].id,
      model: 'Sentra',
      year: 2016,
    },
    {
      id: random.guid(),
      makeId: manufacturers[1].id,
      model: 'Civic',
      year: 2018
    },
    {
      id: random.guid(),
      makeId: manufacturers[1].id,
      model: 'Pilot',
      year: 2015
    },
  ];

  before(async () => {
    knex = Knex(knexConfig);

    await knex.schema.createTable('manufacturers', t => {
      t.uuid('id').primary();
      t.string('name');
    });

    await knex.schema.createTable('vehicles', t => {
      t.uuid('id').primary();
      t.uuid('make_id').references('id').inTable('manufacturers');
      t.string('model');
      t.integer('year');
    });

    await knex('manufacturers').insert(snakeCase(manufacturers));
    await knex('vehicles').insert(snakeCase(vehicles));

    vehicleSubqueries = await getSubqueries('vehicles', knex, {
      make: knex
        .select(
          'v.id as resource_id',
          'm.name as value',
          'm.name as sort'
        )
        .from('vehicles as v')
        .leftJoin('manufacturers as m', 'm.id', 'v.make_id')
    });
  });

  after(async () => {
    await knex.schema.dropTable('vehicles');
    await knex.schema.dropTable('manufacturers');

    await knex.destroy();
  });

  it('should handle undefined filter', async () => {
    let query = knex('vehicles');
    query = getFilterQuery({ filter: undefined, subqueries: vehicleSubqueries }, new KnexQB({ knex, query })).build();

    const result = await query;
    expect(result.length).to.equal(vehicles.length);
  });
  it('should handle empty filter', async () => {
    let query = knex('vehicles');
    query = getFilterQuery({ filter: {}, subqueries: vehicleSubqueries }, new KnexQB({ knex, query })).build();

    const result = await query;
    expect(result.length).to.equal(vehicles.length);
  });

  it('should filter eq', async () => {
    let query = knex('vehicles');
    const filter = {
      year: { eq: 2015 }
    };

    const result = await getFilterQuery({ filter, subqueries: vehicleSubqueries }, new KnexQB({ knex, query })).build();

    expect(result.map(r => r.id)).to.have.members(expectedIds(vehicles, [1, 4]));
  });
  it('should filter ne', async () => {
    let query = knex('vehicles');
    const filter = {
      year: { ne: 2016 }
    };

    const result = await getFilterQuery({ filter, subqueries: vehicleSubqueries }, new KnexQB({ knex, query })).build();

    expect(result.map(r => r.id)).to.have.members(expectedIds(vehicles, [0, 1, 3, 4]));
  });
  it('should filter in', async () => {
    let query = knex('vehicles');
    const filter = {
      year: { in: [2014, 2015] }
    };

    const result = await getFilterQuery({ filter, subqueries: vehicleSubqueries }, new KnexQB({ knex, query })).build();

    expect(result.map(r => r.id)).to.have.members(expectedIds(vehicles, [0, 1, 4]));
  });
  it('should filter nin');
  it('should filter gt');
  it('should filter gte');
  it('should filter lt');
  it('should filter lte');
  it('should filter eq null');
  it('should filter ne null');
  it('should filter contains');
  it('should filter contains case insensitive');

  it('should filter AND');
  it('should filter OR');
  it('should filter AND with nested OR');

  it('should use the correct subquery to filter when there are multiple subqueries');
});

