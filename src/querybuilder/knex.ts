import Knex from 'knex';

import { IQueryBuilder } from './interface';

export class KnexQB implements IQueryBuilder<Knex.QueryBuilder> {
  public static bulkCreateQueries(knex: Knex, queries: Record<string, Knex.QueryBuilder>): Record<string, KnexQB> {
    const result = {};

    Object.entries(queries).forEach(([key, query]) => {
      result[key] = new KnexQB({ knex, query });
    });

    return result;
  }

  private qb;
  private knex;

  constructor(obj: { knex: Knex, query: Knex.QueryBuilder }) {
    if (obj.query) this.qb = obj.query.clone();
    else if (obj.knex) this.qb = obj.knex.queryBuilder();
    else throw new Error('Instance of knex or query builder is required');

    this.knex = obj.knex;
  }

  public select(raw) {
    this.qb.select(raw);

    return this;
  }

  public from(args) {
    if (args instanceof String) {
      this.qb.from(args);
    } else {
      this.qb.from(args.build());
    }

    return this;
  }

  public as(name) {
    this.qb.as(name);

    return this;
  }

  public leftJoin(...args) {
    if (args[0] instanceof String) {
      const [table, column1, column2] = args;
      this.qb.leftJoin(table, column1, column2);
    } else {
      const [subquery, column1, column2] = args;
      this.qb.leftJoin(subquery.build(), column1, column2);
    }

    return this;
  }

  public whereIn(column, args) {
    if (Array.isArray(args)) {
      const values = args;
      this.qb.whereIn(column, values);
    } else {
      const subquery = args;
      this.qb.whereIn(column, subquery.build());
    }

    return this;
  }

  public whereNotIn(column, args) {
    if (Array.isArray(args)) {
      const values = args;
      this.qb.whereNotIn(column, values);
    } else {
      const subquery = args;
      this.qb.whereNotIn(column, subquery.build());
    }

    return this;
  }

  public whereNull(column) {
    this.qb.whereNull(column);

    return this;
  }

  public whereNotNull(column) {
    this.qb.whereNotNull(column);

    return this;
  }

  public where(...args) {
    if (args.length === 3) {
      const [column, operator, value] = args;
      this.whereWithOperation(column, operator, value);
    } else {
      const [callback] = args;
      this.whereWithCallback(callback);
    }

    return this;
  }

  public whereRaw(query, bindings) {
    this.qb.whereRaw(query, bindings);

    return this;
  }

  public orWhere(callback) {
    this.qb.orWhere(this.generateKnexCallback(callback));

    return this;
  }

  public orderBy(field, direction) {
    this.qb.orderBy(field, direction);

    return this;
  }

  public limit(lim) {
    this.qb.limit(lim);

    return this;
  }

  public offset(off) {
    this.qb.offset(off);

    return this;
  }

  public clone() {
    return new (this.constructor as any)(this.knex, this.qb);
  }

  public getNewInstance() {
    return new (this.constructor as any)(this.knex);
  }

  public build() {
    return this.qb;
  }

  private whereWithOperation(column, operator, value) {
    this.qb.where(column, operator, value);
  }

  private whereWithCallback(callback) {
    this.qb.where(this.generateKnexCallback(callback));
  }

  private generateKnexCallback(callback) {
    return (builder) => {
      const knexQb = new KnexQB(builder);
      builder = callback(knexQb).build();
    };
  }
}
