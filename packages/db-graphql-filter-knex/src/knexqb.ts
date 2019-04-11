import { IQueryBuilder } from 'db-graphql-filter';
import Knex from 'knex';

export interface IConstructorArgs {
  /** the knex connection */
  knex: Knex;
  /** the query builder to build off of */
  query: Knex.QueryBuilder;
  /** whether or not to mutate the query builder or clone */
  mutate?: boolean;
}

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

  public constructor(obj: IConstructorArgs) {
    if (obj.query) this.qb = obj.mutate ? obj.query : obj.query.clone();
    else if (obj.knex) this.qb = obj.knex.queryBuilder();
    else throw new Error('Instance of knex or query builder is required');

    this.knex = obj.knex;
  }

  public select(raw: string): this {
    this.qb.select(raw);

    return this;
  }

  public from(args: string | this): this {
    if (args instanceof String) {
      this.qb.from(args);
    } else {
      this.qb.from((args as KnexQB).build());
    }

    return this;
  }

  public as(name: string): this {
    this.qb.as(name);

    return this;
  }

  public leftJoin(...args: [string, string, string] | [this, string, string]): this {
    if (args[0] instanceof String) {
      const [table, column1, column2] = args;
      this.qb.leftJoin(table, column1, column2);
    } else {
      const [subquery, column1, column2] = args;
      this.qb.leftJoin((subquery as KnexQB).build(), column1, column2);
    }

    return this;
  }

  public whereIn(column: string, args: this | Array<string | number>): this {
    if (Array.isArray(args)) {
      const values = args;
      this.qb.whereIn(column, values);
    } else {
      const subquery = args;
      this.qb.whereIn(column, (subquery as KnexQB).build());
    }

    return this;
  }

  public whereNotIn(column: string, args: this | Array<string | number>): this {
    if (Array.isArray(args)) {
      const values = args;
      this.qb.whereNotIn(column, values);
    } else {
      const subquery = args;
      this.qb.whereNotIn(column, (subquery as KnexQB).build());
    }

    return this;
  }

  public whereNull(column: string): this {
    this.qb.whereNull(column);

    return this;
  }

  public whereNotNull(column: string): this {
    this.qb.whereNotNull(column);

    return this;
  }

  public where(...args: [string, string, string | number] | [Function]): this {
    if (args.length === 3) {
      const [column, operator, value] = args;
      this.whereWithOperation(column, operator, value);
    } else {
      const [callback] = args;
      this.whereWithCallback(callback);
    }

    return this;
  }

  public whereRaw(query: string, bindings): this {
    this.qb.whereRaw(query, bindings);

    return this;
  }

  public orWhere(callback: Function): this {
    this.qb.orWhere(this.generateKnexCallback(callback));

    return this;
  }

  public orderBy(field: string, direction: string): this {
    this.qb.orderBy(field, direction);

    return this;
  }

  public limit(lim: number): this {
    this.qb.limit(lim);

    return this;
  }

  public offset(off: number): this {
    this.qb.offset(off);

    return this;
  }

  public clone(): this {
    return new (this.constructor as any)({ knex: this.knex, query: this.qb });
  }

  public getNewInstance(): this {
    return new (this.constructor as any)({ knex: this.knex, query: undefined });
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
    return (builder: Knex.QueryBuilder) => {
      const knexQb = new KnexQB({ knex: this.knex, query: builder, mutate: true });
      callback.call(knexQb, knexQb);
    };
  }
}
