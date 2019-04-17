import { expect } from 'chai';
import Chance from 'chance';
import Knex from 'knex';

import { KnexQB } from 'src/knexqb';

const random = new Chance();

describe('KnexQB', () => {
  let knex: Knex;
  let qb: KnexQB;

  before(async () => {
    knex = Knex({
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
    });

    await knex.schema.createTable('knex_test', (t) => {
      t.uuid('id').primary();
      t.integer('field1');
      t.integer('field2');
      t.integer('field3');
    });

    await knex.schema.createTable('knex_join_test', (t) => {
      t.uuid('id').primary();
      t.uuid('join_column').references('id').inTable('knex_test');
      t.integer('field1');
    });

    await knex('knex_test').insert([{
      id: random.guid(),
      field1: 0,
      field2: 0,
      field3: 0,
    }, {
      id: random.guid(),
      field1: 0,
      field2: 0,
      field3: 1,
    }, {
      id: random.guid(),
      field1: 0,
      field2: 1,
      field3: 0,
    }, {
      id: random.guid(),
      field1: 1,
      field2: 0,
      field3: 0,
    }]);
  });

  after(async () => {
    await knex.schema.dropTable('knex_join_test');
    await knex.schema.dropTable('knex_test');

    await knex.destroy();
  });

  it('should handle select', async () => {
    qb = new KnexQB({ knex, query: knex('knex_test') });
    const result = await qb.select('field1').build();
    expect(result.map((r) => r.field1)).to.have.members([0, 0, 0, 1]);
  });
  it('should handle leftJoin');
  it('should handle whereIn');
  it('should handle whereNotIn');
  it('should handle whereNull');
  it('should handle whereNotNull');
  it('should handle where column, operator, value');
  it('should handle where with callback', async () => {
    qb = new KnexQB({ knex, query: knex('knex_test') });
    const query = qb.where((builder) => builder.where('field1', '=', 1)).build();

    const result = await query;
    expect(result.map((r) => r.field1)).to.have.members([1]);
  });
  it('should handle andWhere');
  it('should handle orWhere');
  it('should handle orderBy');
  it('should hande limit');
  it('should handle offset');

  it('should handle chaning multiple where clauses');
  it('should handle chaining select and from');
  it('should handle chaining andWhere');
  it('should handle chaining orWhere');
});
