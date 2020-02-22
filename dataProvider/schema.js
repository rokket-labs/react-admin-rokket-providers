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

const singCap = val => {
  const sing = pluralize.singular(val)
  return sing.charAt(0).toUpperCase() + sing.slice(1)
}

const hasIt = (values, value) => {
  let found = false
  values.forEach(v => {
    if (v === value) found = true
  })

  return found
}

const getFieldsRecursive = (types, resource, existingTypos = []) => {
  // 1ro - Buscamos si es Typo
  const getData = getFieldData(resource, types)
  let values = [...existingTypos]
  let result = [{ val: null }, values]
  // 2do En caso de ser Typo y por ende tener fields
  if (getData && getData.fields) {
    // 2.1 Lo recorremos
    let newField = { val: null }
    values = !values.includes(resource)
      ? [...values, singCap(resource)]
      : values
    getData.fields.forEach(f => {
      // 2.2 repetimos con nietos en caso de no ser un Typo existente
      // vamos a buscar al hijo
      if (!hasIt(existingTypos, singCap(f.name))) {
        const sub = getFieldsRecursive(types, f.name, values)
        newField
        // if (sub[0].val) {
        result[0].val = {
          ...result[0].val,
          [f.name]: sub[0].val,
        }
        result[1] = sub[1]

        // 2.3 Si ya existe el typo devolvemos null
      } else
        result[0].val = {
          ...result[0].val,
          [f.name]: null,
        }
    })

    // 3ro Si no es Typo devolvemos null, para ser agregado junto a la key
  } else return [{ val: null }, values]

  return result
}

const getFields = (types, resource) => {
  return getFieldsRecursive(types, resource)
}

export default async (client, resource, action) => {
  const query = parse(introspectionQuery)

  const schema = await client.query({ query })

  const { types, queries } = parseIntrospection(schema.data.__schema)

  let fields = []

  fields = getFields(types, resource)[0].val
  console.log('final result', fields)

  // let inputName = null

  // if (resource === 'User' && action === 'update')
  //   inputName = `${resource}UpdateInput`
  // else inputName = `${resource}Input`

  // const foundInputFields = find(propEq('name', `${inputName}`))(types)

  // let inputFields = []

  // if (foundInputFields && resource !== 'File')
  //   inputFields = getFields(foundInputFields.inputFields, types, resource)
  return {
    types,
    queries,
    fields,
    // inputFields,
  }
}
