export default (req: Request): string => {
  // @ts-ignore
  return (req?.headers['x-forwarded-for'] || req?.headers['x-real-ip'] || req?.ip || '').split(',')[0].trim()
}
