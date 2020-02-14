import gql from 'graphql-tag'

export default (name, fields, data, mutation) => {
  const variableString = data ? `(${data})` : ''

  const fieldStructure = Object.entries(fields).map(field => {
    let name = null
    let value
    let fieldList = null
    if (typeof field[1] === 'string') name = field[1]
    if (typeof field[1] === 'object') (name = field[0]), (value = field[1])
    value ? (fieldList = `${name}` + ` {${value}}`) : (fieldList = name)
    return fieldList
  })

  const queryString = `
    ${name}${variableString} {
      ${fieldStructure.join('\n')}
    } 
  `
  return gql`
    ${mutation}
    {
      ${queryString}
    }
  `
}
