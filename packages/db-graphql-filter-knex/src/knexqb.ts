import { IQueryBuilder } from 'db-graphql-filter';
import Knex from 'knex';

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

  public constructor(obj: { knex?: Knex; query?: Knex.QueryBuilder }) {
    if (obj.query) this.qb = obj.query.clone();
    else if (obj.knex) this.qb = obj.knex.queryBuilder();
    else throw new Error('Instance of knex or query builder is required');

    this.knex = obj.knex;
  }

  public select(raw): KnexQB {
    this.qb.select(raw);

    return this;
  }

  public from(args): KnexQB {
    if (args instanceof String) {
      this.qb.from(args);
    } else {
      this.qb.from(args.build());
    }

    return this;
  }

  public as(name): KnexQB {
    this.qb.as(name);

    return this;
  }

  public leftJoin(...args): KnexQB {
    if (args[0] instanceof String) {
      const [table, column1, column2] = args;
      this.qb.leftJoin(table, column1, column2);
    } else {
      const [subquery, column1, column2] = args;
      this.qb.leftJoin(subquery.build(), column1, column2);
    }

    return this;
  }

  public whereIn(column, args): KnexQB {
    if (Array.isArray(args)) {
      const values = args;
      this.qb.whereIn(column, values);
    } else {
      const subquery = args;
      this.qb.whereIn(column, subquery.build());
    }

    return this;
  }

  public whereNotIn(column, args): KnexQB {
    if (Array.isArray(args)) {
      const values = args;
      this.qb.whereNotIn(column, values);
    } else {
      const subquery = args;
      this.qb.whereNotIn(column, subquery.build());
    }

    return this;
  }

  public whereNull(column): KnexQB {
    this.qb.whereNull(column);

    return this;
  }

  public whereNotNull(column): KnexQB {
    this.qb.whereNotNull(column);

    return this;
  }

  public where(...args): KnexQB {
    if (args.length === 3) {
      const [column, operator, value] = args;
      this.whereWithOperation(column, operator, value);
    } else {
      const [callback] = args;
      this.whereWithCallback(callback);
    }

    return this;
  }

  public whereRaw(query, bindings): KnexQB {
    this.qb.whereRaw(query, bindings);

    return this;
  }

  public orWhere(callback): KnexQB {
    this.qb.orWhere(this.generateKnexCallback(callback));

    return this;
  }

  public orderBy(field, direction): KnexQB {
    this.qb.orderBy(field, direction);

    return this;
  }

  public limit(lim): KnexQB {
    this.qb.limit(lim);

    return this;
  }

  public offset(off): KnexQB {
    this.qb.offset(off);

    return this;
  }

  public clone(): KnexQB {
    return new (this.constructor as any)({ knex: this.knex, query: this.qb });
  }

  public getNewInstance(): KnexQB {
    return new (this.constructor as any)({ knex: this.knex });
  }

  public build(): Knex.QueryBuilder {
    return this.qb;
  }

  private whereWithOperation(column, operator, value): void {
    this.qb.where(column, operator, value);
  }

  private whereWithCallback(callback): void {
    this.qb.where(this.generateKnexCallback(callback));
  }

  private generateKnexCallback(callback): Function {
    return (builder) => {
      const knexQb = new KnexQB(builder);
      builder = callback(knexQb).build();
    };
  }
}
