/* eslint-disable object-shorthand */
import buildClient from './client'
import parseSchema from './schema'
import buildQuery from './query'
import { find, propEq } from 'ramda'
import pluralize from 'pluralize'

const slugify = value => {
  value = value.replace(/^\s+|\s+$/g, '')
  value = value.toLowerCase()

  const from = 'àáäâèéëêìíïîòóöôùúüûñç·/_,:;'
  const to = 'aaaaeeeeiiiioooouuuunc------'

  for (let i = 0, l = from.length; i < l; i++)
    value = value.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i))

  value = value
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

  return value
}

export default apiUrl => {
  return {
    getList: async function(resource, params) {
      const action = 'getList'
      const { client } = await buildClient(apiUrl)
      const { queries, fields } = await parseSchema(client, resource, action)

      const foundQuery = find(propEq('name', `all${pluralize(resource)}`))(
        queries,
      )

      const query = buildQuery(foundQuery.name, fields, null, '')

      const response = await client.query({ query })

      if (!params.pagination || !params.filter)
        return {
          data: response.data[foundQuery.name],
          total: response.data[foundQuery.name].length,
        }

      const { page, perPage } = params.pagination
      const paginatedResponse = response.data[foundQuery.name].slice(
        (page - 1) * perPage,
        page * perPage,
      )
      
      const { filter } = params.filter

      if (filter) {
        const filtered = response.data[foundQuery.name].filter(element => {
          const filterKeys = Object.keys(element)

          for (const i of filterKeys)
            if (
              element[i] &&
              slugify(element[i].toString()).includes(
                slugify(filter),
              )
            )
              return element[i]
        })
        const fiteredPaginated = filtered.slice(
          (page - 1) * perPage,
          page * perPage,
        )

        return {
          data: fiteredPaginated,
          total: filtered.length,
        }
      }
      return {
        data: paginatedResponse,
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

      if (response.data[resource].image)
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
    getManyReference: async function(resource, params) {
      const { client } = await buildClient(apiUrl)
      const { queries, fields } = await parseSchema(client, resource)

      const foundQuery = find(propEq('name', resource))(queries)

      const { id } = params
      const data = `id: "${id}"`

      const query = buildQuery(foundQuery.name, fields, data, '')

      const response = await client.query({ query })

      if (response.data[resource].image)
        response.data[resource].image = {
          url: response.data[resource].image,
        }

      return {
        data: response.data[foundQuery.name],
        total: response.data[foundQuery.name].length,
      }
    },
    create: async function(resource, params) {
      const action = 'create'
      const { client } = await buildClient(apiUrl)
      const { queries, fields } = await parseSchema(client, resource, action)

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

          if (name === 'location') {
            const { coordinates } = value
            data = {
              latitude: parseFloat(coordinates[1]),
              longitude: parseFloat(coordinates[0]),
            }
          }

          if (data && name === 'contentFormula')
            Object.values(data).forEach(cf => {
              if (cf.content && cf.content.id) cf.content = cf.content.id
              delete cf.__typename
              return cf
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
            Object.values(data).forEach(cf => {
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
