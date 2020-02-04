import gql from 'graphql-tag'

export default (name, fields, data, mutation) => {
  const paramString = data ? `(${data})` : ''
  const queryString = `
    ${name}${paramString} {
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
