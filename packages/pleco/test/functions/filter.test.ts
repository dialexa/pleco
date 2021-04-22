import { expect } from 'chai';
import Chance from 'chance';
import { knex, Knex } from 'knex';

import { KnexQB } from '@dialexa/pleco-knex';

import { getFilterQuery } from 'src/functions';
import { expectedIds, getSubqueries, knexConfig, snakeCase } from 'test/helpers';

const random = new Chance();

describe('(Functions) Filter', () => {
  let db: Knex;
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

  const getResult = async (filter, query): Promise<string[]> =>
    await getFilterQuery({ filter, subqueries: vehicleSubqueries }, new KnexQB({ knex: db, query }))
      .build()
      .then((result) => result.map((r) => r.id));

  it('should handle undefined filter', async () => {
    const query = db('vehicles');
    const result = await getResult(undefined, query);
    expect(result.length).to.equal(vehicles.length);
  });
  it('should handle empty filter', async () => {
    const query = db('vehicles');
    const result = await getResult({}, query);
    expect(result.length).to.equal(vehicles.length);
  });

  it('should filter eq', async () => {
    const query = db('vehicles');
    const filter = { year: { eq: 2015 } };

    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [1, 4]));
  });
  it('should filter ne', async () => {
    const query = db('vehicles');
    const filter = { year: { ne: 2016 } };

    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [0, 1, 3, 4]));
  });
  it('should filter in', async () => {
    const query = db('vehicles');
    const filter = { year: { in: [2014, 2015] } };

    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [0, 1, 4]));
  });
  it('should filter nin', async () => {
    const query = db('vehicles');
    const filter = { year: { nin: [2014, 2015] } };

    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [2, 3]));
  });
  it('should filter gt', async () => {
    const query = db('vehicles');
    const filter = { year: { gt: 2015 } };

    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [2, 3]));
  });
  it('should filter gte', async () => {
    const query = db('vehicles');
    const filter = { year: { gte: 2015 } };
    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [1, 2, 3, 4]));
  });
  it('should filter lt', async () => {
    const query = db('vehicles');
    const filter = { year: { lt: 2016 } };
    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [0, 1, 4]));
  });
  it('should filter lte', async () => {
    const query = db('vehicles');
    const filter = { year: { lte: 2015 } };
    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [0, 1, 4]));
  });
  it('should filter eq null', async () => {
    const query = db('vehicles');
    const filter = { year: { eq: null } };
    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [5]));
  });
  it('should filter ne null', async () => {
    const query = db('vehicles');
    const filter = { year: { ne: null } };
    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [0, 1, 2, 3, 4]));
  });
  it('should filter contains', async () => {
    const query = db('vehicles');
    const filter = { model: { contains: 'i' } };
    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [0, 1, 3, 4]));
  });
  it('should filter contains case insensitive', async () => {
    const query = db('vehicles');
    const filter = { model: { contains: 'cI' } };
    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [3]));
  });

  it('should filter AND', async () => {
    const query = db('vehicles');
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
    const query = db('vehicles');
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
    const query = db('vehicles');
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
    const query = db('vehicles');
    const filter = {
      AND: [
        { year: { gte: 2015 } },
        { make: { eq: 'Nissan' } },
      ],
    };
    const result = await getResult(filter, query);
    expect(result).to.have.members(expectedIds(vehicles, [1, 2]));
  });

  describe('implicit operators', () => {
    it('should filter with implicit AND', async () => {
      const query = db('vehicles');
      const filter = {
        year: { gte: 2015 },
        make: { eq: 'Honda' },
      };
      const result = await getResult(filter, query);
      expect(result).to.have.members(expectedIds(vehicles, [3, 4]));
    });

    it('should filter with implicit AND nested', async () => {
      const query = db('vehicles');
      const filter = { year: { gte: 2015, lt: 2018 } };
      const result = await getResult(filter, query);
      expect(result).to.have.members(expectedIds(vehicles, [1, 2, 4]));
    });

    it('should filter with mixed implicit and explicit', async () => {
      const query = db('vehicles');
      const filter = {
        make: 'Nissan',
        OR: [{ model: 'Sentra' }, { year: 2015 }],
      };
      const result = await getResult(filter, query);
      expect(result).to.have.members(expectedIds(vehicles, [1, 2]));
    });

    it('should filter with implicit eq', async () => {
      const query = db('vehicles');
      const filter = { model: 'Civic' };
      const result = await getResult(filter, query);
      expect(result).to.have.members(expectedIds(vehicles, [3]));
    });

    it('should filter with implicit in', async () => {
      const query = db('vehicles');
      const filter = { year: [2015, 2016] };
      const result = await getResult(filter, query);
      expect(result).to.have.members(expectedIds(vehicles, [1, 2, 4]));
    });
  });

  describe('implicit columns', () => {
    const getImplicitColumnResult = async (filter, query, subqueries?): Promise<{ query: string; ids: string[] }> => {
      const filterQuery = getFilterQuery({ filter, subqueries }, new KnexQB({ knex: db, query })).build();

      return {
        query: filterQuery.toString(),
        ids: await filterQuery.then((result) => result.map((r) => r.id)),
      };
    };

    it('should filter with implicit column and explicit eq', async () => {
      const query = db('vehicles');
      const filter = { model: { eq: 'Altima' } };
      const result = await getImplicitColumnResult(filter, query);

      expect(result.query).to.eq(`select * from "vehicles" where ("model" = 'Altima')`);
      expect(result.ids).to.have.members(expectedIds(vehicles, [0, 1]));
    });

    it('should filter with implicit column and explicit AND', async () => {
      const query = db('vehicles');
      const filter = { year: { AND: [{ lt: 2018 }, { gt: 2015 }] } };
      const result = await getImplicitColumnResult(filter, query);

      expect(result.query).to.eq(`select * from "vehicles" where (("year" < 2018) and ("year" > 2015))`);
      expect(result.ids).to.have.members(expectedIds(vehicles, [2]));
    });
    it('should filter with implicit column and explicit OR', async () => {
      const query = db('vehicles');
      const filter = { year: { OR: [{ eq: null }, { gt: 2017 }] } };
      const result = await getImplicitColumnResult(filter, query);

      expect(result.query).to.eq(`select * from "vehicles" where (("year" is null) or ("year" > 2017))`);
      expect(result.ids).to.have.members(expectedIds(vehicles, [3, 5]));
    });
    it('should filter with implicit column and implicit eq', async () => {
      const query = db('vehicles');
      const filter = { model: 'Odyssey' };
      const result = await getImplicitColumnResult(filter, query);

      expect(result.query).to.eq(`select * from "vehicles" where ("model" = 'Odyssey')`);
      expect(result.ids).to.have.members(expectedIds(vehicles, [5]));
    });
    it('should filter with implicit column and other subqueries', async () => {
      const { model: _modelQuery, ...subqueries } = vehicleSubqueries;
      const query = db('vehicles');
      const filter = { model: 'Odyssey' };
      const result = await getImplicitColumnResult(filter, query, subqueries);

      expect(result.query).to.eq(`select * from "vehicles" where ("model" = 'Odyssey')`);
      expect(result.ids).to.have.members(expectedIds(vehicles, [5]));
    });
  });
});

