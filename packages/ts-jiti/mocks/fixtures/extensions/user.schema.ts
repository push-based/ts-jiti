// Mock schema object for testing
const userSchema = {
  _def: {
    typeName: 'ZodObject',
    shape: {
      name: { _def: { typeName: 'ZodString' } },
      age: { _def: { typeName: 'ZodNumber' } },
    },
  },
};

export default userSchema;