import gql from 'graphql-tag'

export default (name, fields, data, mutation) => {
  const variableString = data ? `(${data})` : ''

  const fieldStructure = JSON.stringify(fields)
    .replace(/\"/g, '')
    .replace(/:null/g, '')
    .replace(/:/g, '')
    .slice(1, -1)

  const queryString = `
    ${name}${variableString} {
      ${fieldStructure}
    }
    
  `

  const gqlQuery = gql`
    ${mutation}
    {
      ${queryString}
    }
  `

  return gqlQuery
}
