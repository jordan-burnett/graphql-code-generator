export interface TypeMatchOptions {
  exclude?: string[];
  excludePrefixes?: string[];
  excludeSuffixes?: string[];
}

export interface ApolloClientHelpersConfig {
  /**
   * @name useTypeImports
   * @type boolean
   * @default false
   * @description Will use `import type {}` rather than `import {}` when importing only types. This gives
   * compatibility with TypeScript's "importsNotUsedAsValues": "error" option
   *
   * @example
   * ```yaml
   * config:
   *   useTypeImports: true
   * ```
   */
  useTypeImports?: boolean;
  /**
   * @name requireKeyFields
   * @type boolean
   * @default false
   * @description Remove optional sign from all `keyFields` fields.
   *
   */
  requireKeyFields?: boolean;
  /**
   * @name requirePoliciesForAllTypes
   * @type boolean
   * @default false
   * @description Remove optional sign from all generated keys of the root TypePolicy.
   *
   */
  requirePoliciesForAllTypes?: boolean;
  /**
   * @name requirePoliciesForAllTypes
   * @type boolean | TypeMatchOptions
   * @default false
   * @description Remove optional sign from all fields where the type (or subtype if it is a list or union) does not contain an id.
   *
   */
  requirePoliciesForFieldsWithoutId?: boolean | TypeMatchOptions;
}
