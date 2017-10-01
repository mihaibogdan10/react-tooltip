/**
 * To get the tooltip content
 * it may comes from data-tip or this.props.children
 *
 * @params
 * - `tip` {String} value of data-tip
 * - `children` {ReactElement} this.props.children
 *
 * @return
 * - String or react component
 */

export default function (tip, children, getContent) {
  if (children) return children
  if (getContent !== undefined && getContent !== null) return getContent // getContent can be 0, '', etc.
  if (getContent === null) return null // Tip not exist and childern is null or undefined

  return tip
}
