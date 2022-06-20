import path from 'path';

import type { Types, PluginValidateFn, PluginFunction } from '@graphql-codegen/plugin-helpers';
import type { GraphQLSchema } from 'graphql';
import { isInterfaceType, isObjectType } from 'graphql';

import type { ApolloClientHelpersConfig } from './config';
import { typeHasId, typeMatchesOptions } from './utils';

export const plugin: PluginFunction<ApolloClientHelpersConfig> = (
  schema: GraphQLSchema,
  _documents: Types.DocumentFile[],
  config: ApolloClientHelpersConfig
) => {
  const results: Types.ComplexPluginOutput[] = [];

  results.push(generateTypePoliciesSignature(schema, config));

  return {
    prepend: results.reduce<string[]>((prev, result) => [...prev, ...(result.prepend || [])], []),
    append: results.reduce<string[]>((prev, result) => [...prev, ...(result.append || [])], []),
    content: results.map((result) => result.content).join('\n'),
  };
};

function generateTypePoliciesSignature(
  schema: GraphQLSchema,
  config: ApolloClientHelpersConfig
): Types.ComplexPluginOutput {
  const typeMap = schema.getTypeMap();
  const perTypePolicies: string[] = [];

  const rootTypes = [
    schema.getQueryType()?.name,
    schema.getMutationType()?.name,
    schema.getSubscriptionType()?.name,
  ].filter(Boolean);

  const nonOptionalTypes = Object.entries(typeMap).reduce<string[]>((prev, [typeName, type]) => {
    if (
      !rootTypes.includes(typeName) &&
      (config.requirePoliciesForAllTypes ||
        (!typeMatchesOptions(type, config.requirePoliciesForFieldsWithoutId) && !typeHasId(type)))
    ) {
      prev.push(typeName);
    }
    return prev;
  }, []);

  const typedTypePolicies = Object.keys(typeMap).reduce((prev, typeName) => {
    const type = typeMap[typeName];

    if (!typeName.startsWith('__') && (isObjectType(type) || isInterfaceType(type))) {
      const fieldMap = type.getFields();
      const fieldsNames = Object.keys(fieldMap).filter((fieldName) => !fieldName.startsWith('__'));
      const keySpecifierVarName = `${typeName}KeySpecifier`;
      const fieldPolicyVarName = `${typeName}FieldPolicy`;

      perTypePolicies.push(
        `export type ${keySpecifierVarName} = (${fieldsNames
          .map((fieldName) => `'${fieldName}'`)
          .join(' | ')} | ${keySpecifierVarName})[];`
      );

      let hasNonOptionalField = false;
      const fieldPolicies = fieldsNames.map((fieldName) => {
        const field = fieldMap[fieldName];
        const nonOptional =
          field?.type &&
          typeMatchesOptions(field.type, config.requirePoliciesForFieldsWithoutId) &&
          !typeHasId(field.type);
        if (nonOptional) {
          hasNonOptionalField = true;
          nonOptionalTypes.push(typeName);
        }
        return `\t${fieldName}${nonOptional ? '' : '?'}: FieldPolicy<any> | FieldReadFunction<any>`;
      });

      perTypePolicies.push(`export type ${fieldPolicyVarName} = {\n${fieldPolicies.join(',\n')}\n};`);

      return {
        ...prev,
        [typeName]: `Omit<TypePolicy, "fields" | "keyFields"> & {
\t\tkeyFields${config.requireKeyFields ? '' : '?'
          }: false | ${keySpecifierVarName} | (() => undefined | ${keySpecifierVarName}),
\t\tfields${hasNonOptionalField ? '' : '?'}: ${fieldPolicyVarName},
\t}`,
      };
    }

    return prev;
  }, {} as Record<string, string>);

  const rootContent = `export type StrictTypedTypePolicies = {${Object.keys(typedTypePolicies)
    .map((typeName) => {
      const nonOptional = nonOptionalTypes.includes(typeName);
      return `\n\t${typeName}${nonOptional ? '' : '?'}: ${typedTypePolicies[typeName]}`;
    })
    .join(',')}\n};\nexport type TypedTypePolicies = StrictTypedTypePolicies & TypePolicies;`;

  return {
    prepend: [
      `import ${config.useTypeImports ? 'type ' : ''
      }{ FieldPolicy, FieldReadFunction, TypePolicies, TypePolicy } from '@apollo/client/cache';`,
    ],
    content: [...perTypePolicies, rootContent].join('\n'),
  };
}

export const validate: PluginValidateFn<ApolloClientHelpersConfig> = async (
  _schema: GraphQLSchema,
  _documents: Types.DocumentFile[],
  _config,
  outputFile: string
) => {
  if (path.extname(outputFile) !== '.ts' && path.extname(outputFile) !== '.tsx') {
    throw new Error(`Plugin "apollo-client-helpers" requires extension to be ".ts" or ".tsx"!`);
  }
};
