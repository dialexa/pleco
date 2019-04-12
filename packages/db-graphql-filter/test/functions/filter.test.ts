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
      year: 2018,
    },
    {
      id: random.guid(),
      makeId: manufacturers[1].id,
      model: 'Pilot',
      year: 2015,
    },
    {
      id: random.guid(),
      makeId: manufacturers[1].id,
      model: 'Odyssey',
      year: null,
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

  const getResult = async (filter, query): Promise<string[]> =>
    await getFilterQuery({ filter, subqueries: vehicleSubqueries }, new KnexQB({ knex, query }))
      .build()
      .then((result) => result.map((r) => r.id));

  it('should handle undefined filter', async () => {
    const query = knex('vehicles');
    const result = await getResult(undefined, query);
    expect(result.length).to.equal(vehicles.length);
  });
  it('should handle empty filter', async () => {
    const query = knex('vehicles');
    const result = await getResult({}, query);
    expect(result.length).to.equal(vehicles.length);
  });

  it('should filter eq', async () => {
    const query = knex('vehicles');
    const filter = { year: { eq: 2015 } };

    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [1, 4]));
  });
  it('should filter ne', async () => {
    const query = knex('vehicles');
    const filter = { year: { ne: 2016 } };

    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [0, 1, 3, 4]));
  });
  it('should filter in', async () => {
    const query = knex('vehicles');
    const filter = { year: { in: [2014, 2015] } };

    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [0, 1, 4]));
  });
  it('should filter nin', async () => {
    const query = knex('vehicles');
    const filter = { year: { nin: [2014, 2015] } };

    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [2, 3]));
  });
  it('should filter gt', async () => {
    const query = knex('vehicles');
    const filter = { year: { gt: 2015 } };

    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [2, 3]));
  });
  it('should filter gte', async () => {
    const query = knex('vehicles');
    const filter = { year: { gte: 2015 } };
    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [1, 2, 3, 4]));
  });
  it('should filter lt', async () => {
    const query = knex('vehicles');
    const filter = { year: { lt: 2016 } };
    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [0, 1, 4]));
  });
  it('should filter lte', async () => {
    const query = knex('vehicles');
    const filter = { year: { lte: 2015 } };
    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [0, 1, 4]));
  });
  it('should filter eq null', async () => {
    const query = knex('vehicles');
    const filter = { year: { eq: null } };
    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [5]));
  });
  it('should filter ne null', async () => {
    const query = knex('vehicles');
    const filter = { year: { ne: null } };
    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [0, 1, 2, 3, 4]));
  });
  it('should filter contains', async () => {
    const query = knex('vehicles');
    const filter = { model: { contains: 'i' } };
    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [0, 1, 3, 4]));
  });
  it('should filter contains case insensitive', async () => {
    const query = knex('vehicles');
    const filter = { model: { contains: 'cI' } };
    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [3]));
  });

  it('should filter AND', async () => {
    const query = knex('vehicles');
    const filter = {
      year: {
        AND: [
          { in: [2015, 2016, 2017, 2018] },
          { gte: 2016 },
        ],
      },
    };
    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [2, 3]));
  });
  it('should filter OR', async () => {
    const query = knex('vehicles');
    const filter = {
      year: {
        OR: [
          { lte: 2015 },
          { eq: null },
        ],
      },
    };
    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [0, 1, 4, 5]));
  });
  it('should filter AND with nested OR', async () => {
    const query = knex('vehicles');
    const filter = {
      year: {
        AND: [
          { gt: 2014 },
          {
            OR: [
              { lte: 2015 },
              { ne: 2018 },
            ],
          },
        ],
      },
    };
    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [1, 2, 4]));
  });

  it('should use the correct subquery to filter when there are multiple subqueries', async () => {
    const query = knex('vehicles');
    const filter = {
      AND: [
        { year: { gte: 2015 } },
        { make: { eq: 'Nissan' } },
      ],
    };
    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [1, 2]));
  });
});

