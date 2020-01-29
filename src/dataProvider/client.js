import ApolloClient from 'apollo-boost'
import { introspectionQuery, parse } from 'graphql'
import parseIntrospection from './introspection'
import { find, propEq } from 'ramda'

const token = window.localStorage.getItem('accessToken')

const buildClient = uri =>
  new ApolloClient({
    uri,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

export default async (apiUrl, resource) => {
  const client = buildClient(apiUrl)

  const query = parse(introspectionQuery)

  const schema = await client.query({ query })

  const { types, queries } = parseIntrospection(schema.data.__schema)

  const foundResource = find(propEq('name', resource))(types)

  const fields = foundResource.fields
    ? foundResource.fields.map(field => field.name)
    : null

  return {
    client,
    types,
    queries,
    fields,
    foundResource,
  }
}
