/* eslint-disable @typescript-eslint/no-unused-vars */
import { IFilter } from 'src/types';

describe('Types', () => {
  it('should succeed on basic filter', () => {
    const good: IFilter = { field: { eq: 'value' } };
  });

  it('should succeed on basic implicit filter', () => {
    const good: IFilter = { field: 'value' };
  });

  it('should succeed on implicit AND filter', () => {
    const good: IFilter = { field1: 'value1', field2: 'value2' };
  });

  it('should succeed on implicit IN', () => {
    const good: IFilter = { field: ['value1', 'value2'] };
  });

  it('should succeed on AND filter', () => {
    const good: IFilter = { AND: [{ field: 'value' }] };
  });

  it('should succeed on nested AND', () => {
    const good: IFilter = {
      field: {
        AND: [{
          eq: 'value1',
        }, {
          ne: 'value2',
        }],
      },
    };
  });

  it('should succeed on mixed explicit and implicit', () => {
    const good: IFilter = {
      field1: 'value1',
      field2: { eq: 'value2' },
    };
  });

  it('should succeed on complex deeply nested filter', () => {
    const good: IFilter = {
      AND: [{
        field1: 'value1',
        field2: 'value2',
      }, {
        OR: [{
          field3: 'value3',
        }, {
          field4: 'value4',
        }, {
          AND: [{
            field5: 'value5',
          }, {
            field6: 'value6',
          }],
        }],
      }],
    };
  });

  it('should succeed on README example 1', () => {
    const filter: IFilter = {
      AND: [
        { make: { eq: 'nissan' } },
        { model: { in: ['altima', 'sentra'] } },
        { numberOfUsers: { AND: [{ gt: 1000 }, { lt: 1999 }] } },
        {
          OR: [
            { highwayMPG: { gt: 30 } },
            { cityMPG: { gte: 20 } },
          ],
        },
        { userSurveyRating: { gte: 80.5 } },
      ],
    };
  });

  it('should succeed on README example 2', () => {
    const filter: IFilter = { // implicit AND
      make: 'nissan', // implicit eq
      model: ['atlima', 'sentra'], // implicit in
      numberOfUsers: { gt: 1000, lt: 1999 },
      OR: [
        { highwayMPG: { gt: 30 } },
        { cityMPG: { gte: 20 } },
      ],
      userSurveyRating: { gte: 80.5 },
    };
  });

  it('should fail on nested filter with custom keys within custom keys', () => {
    // @ts-expect-error
    const fail: IFilter = { field: { field2: 'value' } };
  });

  it('should fail on deeply nested field within field', () => {
    const fail: IFilter = {
      // @ts-expect-error
      AND: [{
        field1: {
          AND: [{ eq: 'value1' }, { field2: { eq: 'value2' } }],
        },
        field3: { eq: 'value3' },
      }],
    };
  });

  it('should fail for nested operations', () => {
    // @ts-expect-error
    const fail: IFilter = { field: { eq: { eq: 'value' } } };
  });
});
