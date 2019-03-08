import Knex from 'knex';

import { IQueryBuilder } from './interface';

export class KnexQB implements IQueryBuilder<Knex.QueryBuilder> {
  private qb;

  constructor(qb) {
    this.qb = qb.clone();
  }

  public select(raw) {
    this.qb.select(raw);

    return this;
  }

  public from(raw) {
    this.qb.from(raw);

    return this;
  }

  public leftJoin(raw, column1, column2) {
    this.qb.leftJoin(raw, column1, column2);

    return this;
  }

  public whereIn(column, values) {
    this.qb.whereIn(column, values);

    return this;
  }

  public whereNotIn(column, values) {
    this.qb.whereNotIn(column, values);

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

  public andWhere(callback) {
    this.qb.andWhere(this.generateKnexCallback(callback));

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
