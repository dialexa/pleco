import { expect } from 'chai';
import Chance from 'chance';
import { knex, Knex } from 'knex';

import { KnexQB } from '@dialexa/pleco-knex';

import { getSortQuery } from 'src/functions';
import { SortDirection } from 'src/types';
import { expectedIds, getSubqueries, knexConfig, snakeCase } from 'test/helpers';

const random = new Chance();

describe('(Functions) Sort', () => {
  let db: Knex;
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
    db = knex(knexConfig);

    await db.schema.dropTableIfExists('vehicles');
    await db.schema.dropTableIfExists('manufacturers');

    await db.schema.createTable('manufacturers', (t) => {
      t.uuid('id').primary();
      t.string('name');
    });

    await db.schema.createTable('vehicles', (t) => {
      t.uuid('id').primary();
      t.uuid('make_id').references('id').inTable('manufacturers');
      t.string('model');
      t.integer('year');
      t.float('zero_to_sixty');
    });

    await db('manufacturers').insert(snakeCase(manufacturers));
    await db('vehicles').insert(snakeCase(vehicles));

    vehicleSubqueries = await getSubqueries('vehicles', db, {
      make: db
        .select(
          'v.id as resource_id',
          'm.name as value',
          'm.name as sort',
        )
        .from('vehicles as v')
        .leftJoin('manufacturers as m', 'm.id', 'v.make_id'),
    });
  });

  after(async () => {
    await db.schema.dropTable('vehicles');
    await db.schema.dropTable('manufacturers');

    await db.destroy();
  });

  const getResult = async (sort, query): Promise<any[]> =>
    await getSortQuery({ sort, subqueries: vehicleSubqueries }, new KnexQB({ knex: db, query }))
      .build();

  it('should handle undefined sort', async () => {
    const query = db('vehicles');
    const result = await getResult(undefined, query);
    expect(result.length).to.equal(vehicles.length);
  });
  it('should handle empty sort', async () => {
    const query = db('vehicles');
    const result = await getResult({}, query);
    expect(result.length).to.equal(vehicles.length);
  });

  it('should return only the columns specified by the input query', async () => {
    const query = db.select('id', 'model').from('vehicles');
    const sort = { year: 'ASC' };
    const result = await getResult(sort, query);
    expect(result).to.have.deep.members([
      { id: vehicles[0].id, model: vehicles[0].model },
      { id: vehicles[1].id, model: vehicles[1].model },
      { id: vehicles[2].id, model: vehicles[2].model },
    ]);
  });
  it('should sort asc', async () => {
    const query = db('vehicles');
    const sort = { zeroToSixty: 'ASC' };
    const result = await getResult(sort, query);
    expect(result.map((r) => r.id)).to.deep.equal(expectedIds(vehicles, [0, 2, 1]));
  });
  it('should sort desc', async () => {
    const query = db('vehicles');
    const sort = { year: 'DESC' };
    const result = await getResult(sort, query);
    expect(result.map((r) => r.id)).to.deep.equal(expectedIds(vehicles, [2, 0, 1]));
  });
  it('should handle sorting with a distinct query', async () => {
    const subqueries = await getSubqueries('manufacturers', db, {
      arbitrarySort: db
        .select(
          'm.id as resource_id',
          'm.name as value',
          db.raw("(case when m.name = 'Tesla' then 0 else 1 end) as sort"),
        )
        .from('manufacturers as m'),
    });

    const query = db.distinct('m.*').from('manufacturers as m')
      .leftJoin('vehicles as v', 'v.make_id', 'm.id');
    const sort = { arbitrarySort: 'ASC' as SortDirection };
    const result = getSortQuery({ sort, subqueries }, new KnexQB({ knex: db, query })).build();
    expect((await result).map((r) => r.id)).to.deep.equal(expectedIds(manufacturers, [1, 0]));
  });

  describe('implicit columns', () => {
    const getImplicitColumnResult = async (sort, query, subqueries?): Promise<{ query: string; data: any[] }> => {
      const sortQuery = getSortQuery({ sort, subqueries }, new KnexQB({ knex: db, query })).build();

      return {
        query: sortQuery.toString(),
        data: await sortQuery,
      };
    };

    it('should sort with implicit column', async () => {
      const query = db('vehicles');
      const sort = { year: 'ASC' };
      const result = await getImplicitColumnResult(sort, query);

      expect(result.query).to.eq(`select * from "vehicles" order by "year" ASC`);
    });

    it('should sort with implicit column distinct', async () => {
      const query = db.distinct('m.*').from('manufacturers as m')
        .leftJoin('vehicles as v', 'v.make_id', 'm.id');
      const sort = { 'm.name': 'ASC' };
      const result = await getImplicitColumnResult(sort, query);

      // eslint-disable-next-line max-len
      expect(result.query).to.eq(`select distinct "m".* from "manufacturers" as "m" left join "vehicles" as "v" on "v"."make_id" = "m"."id" order by "m"."name" ASC`);
    });

    it('should sort with implicit column and other subqueries', async () => {
      const { model: _modelQuery, ...subqueries } = vehicleSubqueries;
      const query = db('vehicles');
      const sort = { model: 'DESC' };
      const result = await getImplicitColumnResult(sort, query, subqueries);

      expect(result.query).to.eq(`select * from "vehicles" order by "model" DESC`);
    });
  });
});
