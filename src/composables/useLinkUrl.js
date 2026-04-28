export function useLinkUrl() {
  function linkUrl(id) {
    return `${window.location.origin}/p/${id}`
  }
  return { linkUrl }
}
