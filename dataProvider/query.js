import gql from 'graphql-tag'

export default (name, fields, data, mutation) => {
  const variableString = data ? `(${data})` : ''
  const queryString = `
    ${name}${variableString} {
      ${fields.join('\n')}
    } 
  `
  return gql`
    ${mutation}
    {
      ${queryString}
    }
  `
}
