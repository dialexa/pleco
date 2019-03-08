export const joiFilterTests = () => {
  describe('filter', () => {
    it('should handle nested AND');
    it('should handle nested OR');

    it('should reject multiple operators');

    describe('User Defined Joi Schema', () => {
      it('should validate a user specified joi schema correctly');
      it('should reject against a user specified joi schema');
    });

    describe('GraphQL Types', () => {
      it('should validate in for Float');
      it('should validate nin for Float');
      it('should validate eq for Float');
      it('should validate neq for Float');
      it('should validate gt for Float');
      it('should validate gt for Float');
      it('should validate gte for Float');
      it('should validate lte for Float');
      it('should reject contains for Float');

      it('should validate in for ID');
      it('should validate nin for ID');
      it('should validate eq for ID');
      it('should validate neq for ID');
      it('should reject gt for ID');
      it('should reject gt for ID');
      it('should reject gte for ID');
      it('should reject lte for ID');
      it('should reject contains for ID');

      it('should validate in for Int');
      it('should validate nin for Int');
      it('should validate eq for Int');
      it('should validate neq for Int');
      it('should validate gt for Int');
      it('should validate gt for Int');
      it('should validate gte for Int');
      it('should validate lte for Int');
      it('should reject contains for Int');

      it('should validate in for String');
      it('should validate nin for String');
      it('should validate eq for String');
      it('should validate neq for String');
      it('should validate gt for String');
      it('should validate gt for String');
      it('should validate gte for String');
      it('should validate lte for String');
      it('should validate contains for String');
      it('should reject unknown for String');
    });
  });
};
