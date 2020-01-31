import ApolloClient from 'apollo-boost'

const token = window.localStorage.getItem('accessToken')

const buildClient = uri =>
  new ApolloClient({
    uri,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

export default async apiUrl => {
  const client = buildClient(apiUrl)

  return {
    client,
  }
}
