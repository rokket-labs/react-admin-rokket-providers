import gql from 'graphql-tag'

export default (name, fields, params, mutation) => {
  const paramString = params ? `(${params})` : ''
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
