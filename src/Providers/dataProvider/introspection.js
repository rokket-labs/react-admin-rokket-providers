export default schema => {
  const queries = schema.types.reduce((acc, type) => {
    if (
      type.name !== schema.queryType.name &&
      type.name !== schema.mutationType.name
    )
      return acc

    return [...acc, ...type.fields]
  }, [])

  const types = schema.types.filter(
    type =>
      type.name !== schema.queryType.name &&
      type.name !== schema.mutationType.name,
  )

  return {
    types,
    queries,
    schema,
  }
}
