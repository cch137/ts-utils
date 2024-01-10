const base64ToBase64Url = (text: string) => text.replace(/+/g, '-').replace(/\//g, '_')
const base64UrlToBase64 = (text: string) => text.replace(/-/g, '+').replace(/_/g, '/')

export {
  base64ToBase64Url,
  base64UrlToBase64
}
