export function useLinkUrl() {
  function linkUrl(id) {
    return `${window.location.origin}/links/${id}`
  }
  return { linkUrl }
}
