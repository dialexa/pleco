import { expect } from 'chai';
import Chance from 'chance';
import Knex from 'knex';

import { KnexQB } from 'db-query-utils-knex';

import { getSortQuery } from 'src/functions';
import { SortDirection } from 'src/types';
import { expectedIds, getSubqueries, knexConfig, snakeCase } from 'test/helpers';

const random = new Chance();

describe('(Functions) Sort', () => {
  let knex: Knex;
  let vehicleSubqueries: Record<string, KnexQB>;

  const manufacturers = [
    {
      id: random.guid(),
      name: 'Porsche',
    },
    {
      id: random.guid(),
      name: 'Tesla',
    },
  ];

  const vehicles = [
    {
      id: random.guid(),
      makeId: manufacturers[0].id,
      model: '918 Spyder',
      year: 2014,
      zeroToSixty: 2.2,
    },
    {
      id: random.guid(),
      makeId: manufacturers[0].id,
      model: '911 Turbo S',
      year: 2012,
      zeroToSixty: 2.7,
    },
    {
      id: random.guid(),
      makeId: manufacturers[1].id,
      model: 'Model S P100D',
      year: 2016,
      zeroToSixty: 2.28,
    },
  ];

  before(async () => {
    knex = Knex(knexConfig);

    await knex.schema.dropTableIfExists('vehicles');
    await knex.schema.dropTableIfExists('manufacturers');

    await knex.schema.createTable('manufacturers', (t) => {
      t.uuid('id').primary();
      t.string('name');
    });

    await knex.schema.createTable('vehicles', (t) => {
      t.uuid('id').primary();
      t.uuid('make_id').references('id').inTable('manufacturers');
      t.string('model');
      t.integer('year');
      t.float('zero_to_sixty');
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
        .leftJoin('manufacturers as m', 'm.id', 'v.make_id'),
    });
  });

  after(async () => {
    await knex.schema.dropTable('vehicles');
    await knex.schema.dropTable('manufacturers');

    await knex.destroy();
  });

  const getResult = async (sort, query): Promise<any[]> =>
    await getSortQuery({ sort, subqueries: vehicleSubqueries }, new KnexQB({ knex, query }))
      .build();

  it('should handle undefined sort', async () => {
    const query = knex('vehicles');
    const result = await getResult(undefined, query);
    expect(result.length).to.equal(vehicles.length);
  });
  it('should handle empty sort', async () => {
    const query = knex('vehicles');
    const result = await getResult({}, query);
    expect(result.length).to.equal(vehicles.length);
  });

  it('should return only the columns specified by the input query', async () => {
    const query = knex.select('id', 'model').from('vehicles');
    const sort = { year: 'ASC' };
    const result = await getResult(sort, query);
    expect(result).to.have.deep.members([
      { id: vehicles[0].id, model: vehicles[0].model },
      { id: vehicles[1].id, model: vehicles[1].model },
      { id: vehicles[2].id, model: vehicles[2].model },
    ]);
  });
  it('should sort asc', async () => {
    const query = knex('vehicles');
    const sort = { zeroToSixty: 'ASC' };
    const result = await getResult(sort, query);
    expect(result.map((r) => r.id)).to.deep.equal(expectedIds(vehicles, [0, 2, 1]));
  });
  it('should sort desc', async () => {
    const query = knex('vehicles');
    const sort = { year: 'DESC' };
    const result = await getResult(sort, query);
    expect(result.map((r) => r.id)).to.deep.equal(expectedIds(vehicles, [2, 0, 1]));
  });
  it('should handle sorting with a distinct query', async () => {
    const subqueries = await getSubqueries('manufacturers', knex, {
      arbitrarySort: knex
        .select(
          'm.id as resource_id',
          'm.name as value',
          knex.raw("(case when m.name = 'Tesla' then 0 else 1 end) as sort")
        )
        .from('manufacturers as m'),
    });

    const query = knex.distinct('m.*').from('manufacturers as m')
      .leftJoin('vehicles as v', 'v.make_id', 'm.id');
    const sort = { arbitrarySort: 'ASC' as SortDirection };
    const result = getSortQuery({ sort, subqueries }, new KnexQB({ knex, query })).build();
    expect((await result).map((r) => r.id)).to.deep.equal(expectedIds(manufacturers, [1, 0]));
  });
});
