const getScrollTop = () => {
  return Math.ceil(document.documentElement.scrollTop || document.body.scrollTop) + window.innerHeight
}

const isScrolledToBottom = (errorValue = 2) => {
  return getScrollTop() >= document.documentElement.scrollHeight - errorValue
}

export {
  getScrollTop,
  isScrolledToBottom,
}
