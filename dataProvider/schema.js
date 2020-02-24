import { introspectionQuery, parse } from 'graphql'
import parseIntrospection from './introspection'
import { find, propEq } from 'ramda'
import pluralize from 'pluralize'

const getFieldData = (field, types) => {
  const singField = pluralize.singular(field)

  const fieldData = find(
    propEq('name', singField.charAt(0).toUpperCase() + singField.slice(1)),
  )(types)

  return fieldData
}

const hasIt = (values, value) => {
  let found = false
  values.forEach(v => {
    if (v === value) found = true
  })

  return found
}

const getFieldsRecursive = (types, resource, action, existingTypos = []) => {
  const getData = getFieldData(resource, types)
  let values = [...existingTypos]
  const result = [{ val: null }, values]

  if (getData && getData.fields) {
    values = !values.includes(resource) ? [...values, resource] : values
    getData.fields.forEach(f => {
      if (
        f.name !== 'productList' &&
        f.name !== 'contents' &&
        f.name !== 'orders'
      )
        if (!hasIt(existingTypos, f.name)) {
          const sub = getFieldsRecursive(types, f.name, values)

          result[0].val = {
            ...result[0].val,
            [f.name]: sub[0].val,
          }
          result[1] = sub[1]
        } else
          result[0].val = {
            ...result[0].val,
          }
    })
  } else if (getData && getData.inputFields) {
    if (action === 'update' || action === 'create') {
      resource.replace('Input', '')
      resource.replace('UpdateInput', '')
      values = !values.includes(resource) ? [...values, resource] : values
      getData.inputFields.forEach(f => {
        if (
          f.name !== 'productList' &&
          f.name !== 'contents' &&
          f.name !== 'orders'
        )
          if (!hasIt(existingTypos, f.name)) {
            const sub = getFieldsRecursive(types, f.name, values)

            result[0].val = {
              ...result[0].val,
              [f.name]: sub[0].val,
            }
            result[1] = sub[1]
          } else
            result[0].val = {
              ...result[0].val,
            }
      })
    }
  } else return [{ val: null }, values]

  return result
}

const getFields = (types, resource, action) => {
  return getFieldsRecursive(types, resource, action)
}

export default async (client, resource, action) => {
  const query = parse(introspectionQuery)

  const schema = await client.query({ query })

  const { types, queries } = parseIntrospection(schema.data.__schema)

  let fields = []

  fields = getFields(types, resource, action)[0].val

  let inputName = null

  if (resource === 'User' && action === 'update')
    inputName = `${resource}UpdateInput`
  else inputName = `${resource}Input`

  let inputFields = []

  if (resource !== 'File')
    inputFields = getFields(types, inputName, action)[0].val

  return {
    types,
    queries,
    fields,
    inputFields,
  }
}
