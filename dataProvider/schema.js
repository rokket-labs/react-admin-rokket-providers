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

const getSubfields = (field, types) => {
  let subArr = null

  const findSubfield = find(
    propEq('name', field.charAt(0).toUpperCase() + field.slice(1)),
  )(types)

  if (findSubfield)
    subArr = pipe(
      reject(isObject),
      map(field => field.name),
    )(findSubfield.fields)

  return subArr
}

const getFields = (fields, types) => {
  const fieldObj = []
  Object.entries(fields).map(field => {
    const { name } = field[1]
    if (name !== 'orders') {
      const subfields = getSubfields(name, types)
      const value = subfields
        ? (fieldObj[name] = subfields)
        : fieldObj.push(name)
      return value
    }
  })
  return fieldObj
}

export default async (client, resource, action) => {
  const query = parse(introspectionQuery)

  const schema = await client.query({ query })

  const { types, queries } = parseIntrospection(schema.data.__schema)

  const foundResource = find(propEq('name', resource))(types)

  let inputName = null

  if (resource === 'User' && action === 'update')
    inputName = `${resource}UpdateInput`
  else inputName = `${resource}Input`

  const foundInputFields = find(propEq('name', `${inputName}`))(types)

  let inputFields = []

  if (foundInputFields)
    inputFields = getFields(foundInputFields.inputFields, types)

  let fields = null

  if (foundResource.fields) fields = getFields(foundResource.fields, types)

  return {
    types,
    queries,
    fields,
    foundResource,
    inputFields,
  }
}
