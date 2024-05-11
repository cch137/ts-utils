export const getScrollTop = () =>
  Math.ceil(document.documentElement.scrollTop || document.body.scrollTop) +
  window.innerHeight;

export const isScrolledToBottom = (errorValue = 2) =>
  getScrollTop() >= document.documentElement.scrollHeight - errorValue;
