import { AskInput, AskInputMsg } from "."

export const wrapMessages = (m: AskInputMsg) => {
  return Array.isArray(m)
    ? m
    : typeof m === 'string'
      ? [{role: 'user', text: m}]
      : [m]
}

export const wrapOptions = (m: AskInput) => {
  return (typeof m === 'string' || Array.isArray(m) || 'text' in m)
    ? {messages: wrapMessages(m)}
    : m
}
