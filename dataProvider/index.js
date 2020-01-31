/* eslint-disable object-shorthand */
import buildClient from '../dataProvider/client'
import parseSchema from '../dataProvider/schema'
import buildQuery from '../dataProvider/query'
import { find, propEq } from 'ramda'
import pluralize from 'pluralize'

export default apiUrl => {
  return {
    getList: async function(resource, params) {
      const { client } = await buildClient(apiUrl)
      const { queries, fields } = await parseSchema(client, resource)

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
      const { queries, foundResource, fields } = await parseSchema(
        client,
        resource,
      )

      const foundQuery = find(propEq('name', resource))(queries)

      const { id } = params
      const data = `id: "${id}"`

      const query = buildQuery(foundQuery.name, fields, data, '')

      const response = await client.query({ query })

      return {
        data: response.data[foundResource.name],
      }
    },
    getMany: async function(resource, params) {
      const { client } = await buildClient(apiUrl)
      const { queries, fields } = await parseSchema(client, resource)

      const foundQuery = find(propEq('name', `getMany${pluralize(resource)}`))(
        queries,
      )

      const { ids } = params
      const data = `ids: "${ids}"`

      const query = buildQuery(foundQuery.name, fields, data, '')

      const response = await client.query({ query })

      return {
        data: response.data[foundQuery.name],
      }
    },
    create: async function(resource, params) {
      const { client } = await buildClient(apiUrl)
      const { queries, foundResource, fields } = await parseSchema(
        client,
        resource,
      )

      const foundQuery = find(propEq('name', `create${foundResource.name}`))(
        queries,
      )

      const mutation = `mutation ${foundQuery.name}($input: ${resource}Input!) `
      const data = `input: $input`

      const query = buildQuery(foundQuery.name, fields, data, mutation)

      const newParams = { ...params.data }
      delete newParams.id
      delete newParams.__typename

      const response = await client.mutate({
        mutation: query,
        variables: {
          input: newParams,
        },
      })

      return {
        data: response.data[foundQuery.name],
      }
    },
    update: async function(resource, params) {
      const { client } = await buildClient(apiUrl)
      const { queries, foundResource, fields } = await parseSchema(
        client,
        resource,
      )

      const foundQuery = find(propEq('name', `update${foundResource.name}`))(
        queries,
      )

      const { id } = params
      const mutation = `mutation ${foundQuery.name}($input: ${resource}Input!) `
      const data = `input: $input, id: "${id}"`

      const query = buildQuery(foundQuery.name, fields, data, mutation)

      const newParams = { ...params.data }
      delete newParams.id
      delete newParams.__typename

      const response = await client.mutate({
        mutation: query,
        variables: {
          input: newParams,
        },
      })

      return {
        data: response.data[foundQuery.name],
      }
    },
    updateMany: async function(resource, params) {
      const { client } = await buildClient(apiUrl)
      const { queries, foundResource, fields } = await parseSchema(
        client,
        resource,
      )

      const foundQuery = find(
        propEq('name', `update${pluralize(foundResource.name)}`),
      )(queries)

      const { ids } = params
      const mutation = `mutation`
      const data = `input: $input, ids: "${ids}"`

      const query = buildQuery(foundQuery.name, fields, data, mutation)

      const newParams = { ...params.data }
      delete newParams.id
      delete newParams.__typename

      const response = await client.mutate({
        mutation: query,
        variables: {
          input: newParams,
        },
      })

      return {
        data: response.data[foundQuery.name],
      }
    },
    delete: async function(resource, params) {
      const { client } = await buildClient(apiUrl)
      const { queries, foundResource, fields } = await parseSchema(
        client,
        resource,
      )

      const foundQuery = find(propEq('name', `delete${foundResource.name}`))(
        queries,
      )

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
      const { queries, foundResource, fields } = await parseSchema(
        client,
        resource,
      )

      const foundQuery = find(
        propEq('name', `delete${pluralize(foundResource.name)}`),
      )(queries)

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
