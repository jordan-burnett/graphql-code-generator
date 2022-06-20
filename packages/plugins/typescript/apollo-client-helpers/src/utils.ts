import type { GraphQLType } from 'graphql';
import { isListType, isNonNullType, isObjectType, isUnionType } from 'graphql';

import type { TypeMatchOptions } from './config';

export const typeMatchesOptions = (type: GraphQLType, options?: boolean | TypeMatchOptions): boolean => {
  if (typeof options === 'boolean') {
    return options;
  }
  if (isListType(type) || isNonNullType(type)) {
    return typeMatchesOptions(type.ofType, options);
  }
  return Boolean(
    !options?.exclude?.includes(type.name) &&
    !options?.excludePrefixes?.some((prefix) => type.name.startsWith(prefix)) &&
    !options?.excludeSuffixes?.some((suffix) => type.name.endsWith(suffix))
  );
};

export const typeHasId = (type?: GraphQLType): boolean => {
  if (isNonNullType(type) || isListType(type)) {
    return typeHasId(type.ofType);
  } else if (isUnionType(type)) {
    return type.getTypes().every((subType) => typeHasId(subType));
  } else if (isObjectType(type)) {
    return !!type.getFields()['id'];
  }
  return true;
};
