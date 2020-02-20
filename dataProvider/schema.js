import { introspectionQuery, parse } from 'graphql'
import parseIntrospection from './introspection'
import { find, pipe, propEq, map, isNil, reject } from 'ramda'

const findType = (field, types) => {
  const findTypes = find(
    propEq('name', field.charAt(0).toUpperCase() + field.slice(1)),
  )(types)

  return findTypes
}

const isObjectRecursive = type => {
  if (isNil(type.ofType)) return type.kind === 'OBJECT'

  return isObjectRecursive(type.ofType)
}

const isObject = field => {
  return isObjectRecursive(field.type)
}

const getSubfields = (field, types) => {
  let subArr = null

  const findSubfield = findType(field, types)

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
    const fieldData = findType(name, types)
    let type = null
    if (fieldData) type = fieldData.kind
    let subfields = null
    let value = null
    if (
      name !== 'orders' &&
      name !== 'productList' &&
      name !== 'transactionId'
    ) {
      if (type !== 'ENUM' && type !== 'SCALAR')
        subfields = getSubfields(name, types)
      value = subfields ? (fieldObj[name] = subfields) : (fieldObj[name] = null)
    }
    return value
  })
  return fieldObj
}

export default async (client, resource, action) => {
  const query = parse(introspectionQuery)

  const schema = await client.query({ query })

  const { types, queries } = parseIntrospection(schema.data.__schema)

  const foundResource = find(propEq('name', resource))(types)

  let fields = null

  if (foundResource.fields) fields = getFields(foundResource.fields, types)

  let inputName = null

  if (resource === 'User' && action === 'update')
    inputName = `${resource}UpdateInput`
  else inputName = `${resource}Input`

  const foundInputFields = find(propEq('name', `${inputName}`))(types)

  let inputFields = []

  if (foundInputFields && resource !== 'File')
    inputFields = getFields(foundInputFields.inputFields, types)

  return {
    types,
    queries,
    fields,
    foundResource,
    inputFields,
  }
}
