import { introspectionQuery, parse } from 'graphql'
import parseIntrospection from './introspection'
import { find, pipe, propEq, map, isNil, reject } from 'ramda'

const isObjectRecursive = type => {
  if (isNil(type.ofType)) return type.kind === 'OBJECT'

  return isObjectRecursive(type.ofType)
}

const isObject = field => {
  return isObjectRecursive(field.type)
}

export default async (client, resource) => {
  const query = parse(introspectionQuery)

  const schema = await client.query({ query })

  const { types, queries } = parseIntrospection(schema.data.__schema)

  const foundResource = find(propEq('name', resource))(types)

  let fields = null

  if (foundResource.fields)
    fields = pipe(
      reject(isObject),
      map(field => field.name),
    )(foundResource.fields)

  return {
    types,
    queries,
    fields,
    foundResource,
  }
}
