import { expect } from 'chai';
import Chance from 'chance';
import Knex from 'knex';

import { KnexQB } from 'pleco-knex';

import { getPageLimitOffsetQuery } from 'src/functions';
import { knexConfig } from 'test/helpers';

const random = new Chance();

describe('(Functions) Page', () => {
  let knex: Knex;

  let data = random.n(() => ({ name: random.name() }), 5);
  data = data.map((d, id) => ({ ...d, id }));

  before(async () => {
    knex = Knex(knexConfig);

    await knex.schema.dropTableIfExists('page_test');

    await knex.schema.createTable('page_test', (t) => {
      t.integer('id').primary();
      t.string('name');
    });

    await knex('page_test').insert(data);
  });

  after(async () => {
    await knex.schema.dropTable('page_test');

    await knex.destroy();
  });

  describe('Limit Offset', () => {
    const getResult = async (page, query): Promise<any[]> =>
      await getPageLimitOffsetQuery(page, new KnexQB({ knex, query })).build();

    it('should handle undefined page', async () => {
      const query = knex('page_test');
      const result = await getResult(undefined, query);
      expect(result.length).to.equal(data.length);
    });
    it('should handle empty page', async () => {
      const query = knex('page_test');
      const result = await getResult({}, query);
      expect(result.length).to.equal(data.length);
    });
    it('should handle page with just offset', async () => {
      const query = knex('page_test').orderBy('id');
      const result = await getResult({ offset: 2 }, query);
      expect(result.length).to.equal(3);
      expect(result.map((r) => r.id)).to.have.members([2, 3, 4]);
    });
    it('should handle page with just limit', async () => {
      const query = knex('page_test').orderBy('id');
      const result = await getResult({ limit: 2 }, query);
      expect(result.length).to.equal(2);
      expect(result.map((r) => r.id)).to.have.members([0, 1]);
    });
    it('should page with limit and offset', async () => {
      const query = knex('page_test').orderBy('id');
      const result = await getResult({ limit: 1, offset: 3 }, query);
      expect(result.length).to.equal(1);
      expect(result.map((r) => r.id)).to.have.members([3]);
    });
  });
});
