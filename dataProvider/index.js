/* eslint-disable object-shorthand */
import buildClient from '../dataProvider/client'
import parseSchema from '../dataProvider/schema'
import buildQuery from '../dataProvider/query'
import { find, propEq } from 'ramda'
import pluralize from 'pluralize'

export default apiUrl => {
  return {
    getList: async function(resource) {
      const action = 'getList'
      const { client } = await buildClient(apiUrl)
      const { queries, fields } = await parseSchema(client, resource, action)

      const foundQuery = find(propEq('name', `all${pluralize(resource)}`))(
        queries,
      )

      const query = buildQuery(foundQuery.name, fields, null, '')

      const response = await client.query({ query })

      return {
        data: response.data[foundQuery.name],
        total: response.data[foundQuery.name].length,
      }
    },
    getOne: async function(resource, params) {
      const { client } = await buildClient(apiUrl)
      const { queries, fields } = await parseSchema(client, resource)

      const foundQuery = find(propEq('name', resource))(queries)

      const { id } = params
      const data = `id: "${id}"`

      const query = buildQuery(foundQuery.name, fields, data, '')

      const response = await client.query({ query })

      if (resource === 'Formula')
        response.data[resource].image = {
          url: response.data[resource].image,
        }

      return {
        data: response.data[resource],
      }
    },
    getMany: async function(resource, params) {
      const { client } = await buildClient(apiUrl)
      const { queries, fields } = await parseSchema(client, resource)

      const foundQuery = find(propEq('name', `all${pluralize(resource)}`))(
        queries,
      )

      const query = buildQuery(foundQuery.name, fields, null, '')

      const response = await client.query({ query })

      return {
        data: [response.data[foundQuery.name]],
      }
    },
    create: async function(resource, params) {
      const action = 'create'
      const { client } = await buildClient(apiUrl)
      const { queries, inputFields, fields } = await parseSchema(
        client,
        resource,
        action,
      )

      let queryName = null

      if (resource === 'User') queryName = `signUp`
      else queryName = `create${resource}`

      const foundQuery = find(propEq('name', `${queryName}`))(queries)

      const mutation = `mutation ${foundQuery.name}($input: ${resource}Input!)`

      const data = `input: $input`

      if (params.data.image) params.data.image = params.data.image.url

      const query = buildQuery(foundQuery.name, fields, data, mutation)

      const response = await client.mutate({
        mutation: query,
        variables: {
          input: params.data,
        },
      })

      return {
        data: response.data[foundQuery.name],
      }
    },
    update: async function(resource, params) {
      const action = 'update'
      const { client } = await buildClient(apiUrl)
      const { queries, inputFields } = await parseSchema(
        client,
        resource,
        action,
      )

      const foundQuery = find(propEq('name', `update${resource}`))(queries)

      const { id } = params

      let inputName = null

      if (resource === 'User' || resource === 'VendingMachine')
        inputName = `${resource}UpdateInput!`
      else inputName = `${resource}Input!`

      const mutation = `mutation ${foundQuery.name}($input: ${inputName})`
      const data = `input: $input, id: "${id}"`

      const query = buildQuery(foundQuery.name, inputFields, data, mutation)

      const objInput = {}

      Object.entries(params.data).map(item => {
        const name = item[0]
        const value = item[1]
        let data

        Object.keys(inputFields).map(filter => {
          if (name === filter)
            if (value && value.id) data = item[1].id
            else data = item[1]

          if (data && name === 'contentFormula')
            Object.values(data).map(cf => {
              if (cf.content && cf.content.id) cf.content = cf.content.id
              delete cf.__typename
            })

          return (objInput[name] = data)
        })
        return objInput
      })

      if (params.data.image) objInput.image = params.data.image.url

      const response = await client.mutate({
        mutation: query,
        variables: {
          input: objInput,
        },
      })

      return {
        data: response.data[foundQuery.name],
      }
    },
    updateMany: async function(resource, params) {
      const { client } = await buildClient(apiUrl)
      const { queries, foundResource, inputFields } = await parseSchema(
        client,
        resource,
      )

      const foundQuery = find(
        propEq('name', `update${pluralize(foundResource.name)}`),
      )(queries)

      const { ids } = params
      let inputName = null

      if (resource === 'User' || resource === 'VendingMachine')
        inputName = `${resource}UpdateInput!`
      else inputName = `${resource}Input!`

      const mutation = `mutation ${foundQuery.name}($input: ${inputName})`
      const data = `input: $input, ids: "${ids}"`

      const query = buildQuery(foundQuery.name, inputFields, data, mutation)

      const objInput = {}

      Object.entries(params.data).map(item => {
        const name = item[0]
        const value = item[1]
        let data

        Object.keys(inputFields).map(filter => {
          if (name === filter)
            if (value && value.id) data = item[1].id
            else data = item[1]

          if (data && name === 'contentFormula')
            Object.values(data).map(cf => {
              if (cf.content && cf.content.id) cf.content = cf.content.id
              delete cf.__typename
            })

          return (objInput[name] = data)
        })
        return objInput
      })

      if (params.data.image) objInput.image = params.data.image.url

      const response = await client.mutate({
        mutation: query,
        variables: {
          input: objInput,
        },
      })

      return {
        data: response.data[foundQuery.name],
      }
    },
    delete: async function(resource, params) {
      const { client } = await buildClient(apiUrl)
      const { queries, fields } = await parseSchema(client, resource)

      const foundQuery = find(propEq('name', `delete${resource}`))(queries)

      const { id } = params
      const mutation = `mutation`
      const data = `id: "${id}"`

      const query = buildQuery(foundQuery.name, fields, data, mutation)

      const response = await client.mutate({ mutation: query })

      return {
        data: response.data[foundQuery.name],
      }
    },
    deleteMany: async function(resource, params) {
      const { client } = await buildClient(apiUrl)
      const { queries, fields } = await parseSchema(client, resource)

      const foundQuery = find(propEq('name', `delete${pluralize(resource)}`))(
        queries,
      )

      const { ids } = params
      const mutation = `mutation`
      const data = `ids: "${ids}"`

      const query = buildQuery(foundQuery.name, fields, data, mutation)

      const response = await client.mutate({ mutation: query })

      return {
        data: response.data[foundQuery.name],
      }
    },
  }
}
