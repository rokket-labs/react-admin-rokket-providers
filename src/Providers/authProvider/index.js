/* eslint-disable object-shorthand */
import decodeJwt from 'jwt-decode'
import buildClient from '../dataProvider/client'
import buildQuery from '../dataProvider/query'
import { find, propEq } from 'ramda'

export default {
  login: async function(params) {
    const apiUrl = 'http://localhost:3000/graphql'
    const resource = 'Login'

    const { queries, client } = await buildClient(apiUrl, resource)
    const foundQuery = find(propEq('name', resource.toLowerCase()))(queries)

    const mutation = `mutation ${foundQuery.name}($login: ${resource}!) `
    const data = `input: $login`
    const field = ['accessToken']

    const query = buildQuery(foundQuery.name, field, data, mutation)

    const loginVariable = {
      email: params.username,
      password: params.password,
    }

    const response = await client.mutate({
      mutation: query,
      variables: {
        login: loginVariable,
      },
    })

    const responseData = response.data[foundQuery.name]
    const token = responseData.accessToken
    localStorage.setItem('accessToken', token)

    return Promise.resolve()
  },
  logout: async function() {
    localStorage.removeItem('accessToken')
    return Promise.resolve()
  },
  checkError: async function(params) {
    if (params.status === 401 || params.status === 403) {
      localStorage.removeItem('accessToken')
      return Promise.reject()
    }
    return Promise.resolve()
  },
  checkAuth: async function() {
    const token = localStorage.getItem('accessToken')
    const decodedToken = decodeJwt(token)
    const currentTime = new Date().getTime() / 1000

    return currentTime < decodedToken.exp ? Promise.resolve() : Promise.reject()
  },
  getPermissions: async function() {
    Promise.resolve()
  },
}
