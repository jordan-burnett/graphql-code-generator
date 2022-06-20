import { mergeOutputs } from '@graphql-codegen/plugin-helpers';
import { buildSchema } from 'graphql';

import { plugin } from '../src/index';

describe('apollo-client-helpers', () => {
  it('Should output typePolicies object correctly', async () => {
    const schema = buildSchema(/* GraphQL */ `
      type Query {
        user: User!
      }
      type User {
        id: ID!
        name: String!
      }
    `);
    const result = mergeOutputs([await plugin(schema, [], {})]);
    expect(result).toMatchSnapshot();
  });

  it('Should output typePolicies object with requireKeyFields: true', async () => {
    const schema = buildSchema(/* GraphQL */ `
      type Query {
        user: User!
      }
      type User {
        id: ID!
        name: String!
      }
    `);
    const result = mergeOutputs([
      await plugin(schema, [], {
        requireKeyFields: true,
      }),
    ]);
    expect(result).toContain(`keyFields:`);
    expect(result).not.toContain(`keyFields?:`);
    expect(result).toMatchSnapshot();
  });

  it('Should output typePolicies object with requirePoliciesForAllTypes: true', async () => {
    const schema = buildSchema(/* GraphQL */ `
      type Query {
        user: User!
      }
      type User {
        id: ID!
        name: String!
      }
    `);
    const result = mergeOutputs([
      await plugin(schema, [], {
        requirePoliciesForAllTypes: true,
      }),
    ]);
    expect(result).toContain(`User:`);
    expect(result).toContain(`Query?:`);
    expect(result).toMatchSnapshot();
  });

  it('Should output typePolicies object with requirePoliciesForFieldsWithoutId: true', async () => {
    const schema = buildSchema(/* GraphQL */ `
      type Query {
        user: User
        nonNullableUser: User!
        users: [User]
        nonNullableUsers: [User!]!
        visitor: Visitor
        nonNullableVisitor: Visitor
        visitors: [Visitor]
        nonNullableVisitors: [Visitor!]!
      }
      type User {
        name: String!
      }
      type Admin {
        id: ID!
        name: String
      }
      union Visitor = User | Admin
    `);
    const result = mergeOutputs([
      await plugin(schema, [], {
        requirePoliciesForFieldsWithoutId: true,
      }),
    ]);
    expect(result).toContain('Query:');
    expect(result).toContain('fields:');
    expect(result).toContain(`users:`);
    expect(result).toContain(`nonNullableUsers:`);
    expect(result).toContain(`user:`);
    expect(result).toContain(`nonNullableUser:`);
    expect(result).toContain(`visitors:`);
    expect(result).toContain(`nonNullableVisitors:`);
    expect(result).toContain(`visitor:`);
    expect(result).toContain(`nonNullableVisitors:`);
    expect(result).toContain(`id?:`);
    expect(result).toContain(`name?:`);
    expect(result).toMatchSnapshot();
  });

  it('Should output typePolicies object with requirePoliciesForFieldsWithoutId and excluded types', async () => {
    const schema = buildSchema(/* GraphQL */ `
      type Query {
        user: User
      }
      type User {
        name: String!
      }
    `);
    const result = mergeOutputs([
      await plugin(schema, [], {
        requirePoliciesForFieldsWithoutId: {
          exclude: ['User'],
        },
      }),
    ]);
    expect(result).toContain(`user?:`);
    expect(result).toContain(`User:`);
    expect(result).toMatchSnapshot();
  });

  it('Should output typePolicies object with requirePoliciesForFieldsWithoutId and excluded prefixes', async () => {
    const schema = buildSchema(/* GraphQL */ `
      type Query {
        user: TempUser
      }
      type TempUser {
        name: String!
      }
    `);
    const result = mergeOutputs([
      await plugin(schema, [], {
        requirePoliciesForFieldsWithoutId: {
          excludePrefixes: ['Temp'],
        },
      }),
    ]);
    expect(result).toContain(`user?:`);
    expect(result).toContain(`TempUser:`);
    expect(result).toMatchSnapshot();
  });

  it('Should output typePolicies object with requirePoliciesForFieldsWithoutId and excluded suffixes', async () => {
    const schema = buildSchema(/* GraphQL */ `
      type Query {
        user: UserNode
      }
      type UserNode {
        name: String!
      }
    `);
    const result = mergeOutputs([
      await plugin(schema, [], {
        requirePoliciesForFieldsWithoutId: {
          excludeSuffixes: ['Node'],
        },
      }),
    ]);
    expect(result).toContain(`user?:`);
    expect(result).toContain(`UserNode:`);
    expect(result).toMatchSnapshot();
  });
});
