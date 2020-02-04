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

export default async (client, resource, action) => {
  const query = parse(introspectionQuery)

  const schema = await client.query({ query })

  const { types, queries } = parseIntrospection(schema.data.__schema)

  const foundResource = find(propEq('name', resource))(types)

  let inputFieldsName = null

  if (resource === 'User' && action === 'update')
    inputFieldsName = `${resource}UpdateInput`
  else inputFieldsName = `${resource}Input`

  const foundInputFields = find(propEq('name', `${inputFieldsName}`))(types)

  let inputFields = []

  if (foundInputFields)
    inputFields = foundInputFields.inputFields
      .map(field => inputFields.concat(field.name))
      .flat()

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
    inputFields,
  }
}
