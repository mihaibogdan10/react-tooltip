'use strict'

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'
import classname from 'classnames'

/* Decoraters */
import staticMethods from './decorators/staticMethods'
import windowListener from './decorators/windowListener'
import customEvent from './decorators/customEvent'
import isCapture from './decorators/isCapture'

/* Utils */
import getPosition from './utils/getPosition'
import { parseAria } from './utils/aria'
import nodeListToArray from './utils/nodeListToArray'

@staticMethods
@windowListener
@customEvent
@isCapture
class ReactTooltip extends Component {

  static propTypes = {
    children: PropTypes.any,
    place: PropTypes.string,
    type: PropTypes.string,
    offset: PropTypes.object,
    border: PropTypes.bool,
    class: PropTypes.string,
    className: PropTypes.string,
    id: PropTypes.string,
    delayHide: PropTypes.number,
    delayShow: PropTypes.number,
    event: PropTypes.string,
    eventOff: PropTypes.string,
    isCapture: PropTypes.bool,
    globalEventOff: PropTypes.string,
    afterShow: PropTypes.func,
    afterHide: PropTypes.func,
    scrollHide: PropTypes.bool,
    resizeHide: PropTypes.bool
  };

  static defaultProps = {
    resizeHide: true
  };

  constructor (props) {
    super(props)
    this.state = {
      place: 'top', // Direction of tooltip
      type: 'dark', // Color theme of tooltip
      show: false,
      border: false,
      offset: {},
      extraClass: '',
      delayHide: 0,
      delayShow: 0,
      event: props.event || null,
      eventOff: props.eventOff || null,
      currentEvent: null, // Current mouse event
      currentTarget: null, // Current target of mouse event
      ariaProps: parseAria(props) // aria- and role attributes
    }

    this.bind([
      'showTooltip',
      'updateTooltip',
      'hideTooltip',
      'globalRebuild',
      'globalShow',
      'globalHide',
      'onWindowResize'
    ])

    this.mount = true
    this.delayShowLoop = null
    this.delayHideLoop = null
  }

  /**
   * For unify the bind and unbind listener
   */
  bind (methodArray) {
    methodArray.forEach(method => {
      this[method] = this[method].bind(this)
    })
  }

  componentDidMount () {
    const { resizeHide } = this.props
    this.bindListener() // Bind listener for tooltip
    this.bindWindowEvents(resizeHide) // Bind global event for static method
  }

  componentWillReceiveProps (props) {
    const { ariaProps } = this.state
    const newAriaProps = parseAria(props)

    const isChanged = Object.keys(newAriaProps).some(props => {
      return newAriaProps[props] !== ariaProps[props]
    })
    if (isChanged) {
      this.setState({ ariaProps: newAriaProps })
    }
  }

  componentWillUnmount () {
    this.mount = false

    this.clearTimer()

    this.unbindListener()
    this.removeScrollListener()
    this.unbindWindowEvents()
  }

  /**
   * Pick out corresponded target elements
   */
  getTargetArray (id) {
    let targetArray
    if (!id) {
      targetArray = document.querySelectorAll('[data-tip]:not([data-for])')
    } else {
      const escaped = id.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      targetArray = document.querySelectorAll(`[data-tip][data-for="${escaped}"]`)
    }
    // targetArray is a NodeList, convert it to a real array
    return nodeListToArray(targetArray)
  }

  /**
   * Bind listener to the target elements
   * These listeners used to trigger showing or hiding the tooltip
   */
  bindListener () {
    const {id, globalEventOff} = this.props
    let targetArray = this.getTargetArray(id)

    targetArray.forEach(target => {
      const isCaptureMode = this.isCapture(target)
      if (target.getAttribute('currentItem') === null) {
        target.setAttribute('currentItem', 'false')
      }
      this.unbindBasicListener(target)

      if (this.isCustomEvent(target)) {
        this.customBindListener(target)
        return
      }

      target.addEventListener('mouseenter', this.showTooltip, isCaptureMode)
      target.addEventListener('mouseleave', this.hideTooltip, isCaptureMode)
    })

    // Global event to hide tooltip
    if (globalEventOff) {
      window.removeEventListener(globalEventOff, this.hideTooltip)
      window.addEventListener(globalEventOff, this.hideTooltip, false)
    }
  }

  /**
   * Unbind listeners on target elements
   */
  unbindListener () {
    const {id, globalEventOff} = this.props
    const targetArray = this.getTargetArray(id)
    targetArray.forEach(target => {
      this.unbindBasicListener(target)
      if (this.isCustomEvent(target)) this.customUnbindListener(target)
    })

    if (globalEventOff) window.removeEventListener(globalEventOff, this.hideTooltip)
  }

  /**
   * Invoke this before bind listener and ummount the compont
   * it is necessary to invloke this even when binding custom event
   * so that the tooltip can switch between custom and default listener
   */
  unbindBasicListener (target) {
    const isCaptureMode = this.isCapture(target)
    target.removeEventListener('mouseenter', this.showTooltip, isCaptureMode)
    target.removeEventListener('mousemove', this.updateTooltip, isCaptureMode)
    target.removeEventListener('mouseleave', this.hideTooltip, isCaptureMode)
  }

  /**
   * When mouse enter, show the tooltip
   */
  showTooltip (e, isGlobalCall) {
    if (isGlobalCall) {
      // Don't trigger other elements belongs to other ReactTooltip
      const targetArray = this.getTargetArray(this.props.id)
      const isMyElement = targetArray.some(ele => ele === e.currentTarget)
      if (!isMyElement || this.state.show) return
    }

    // if it needs to skip adding hide listener to scroll
    let scrollHide = true
    if (e.currentTarget.getAttribute('data-scroll-hide')) {
      scrollHide = e.currentTarget.getAttribute('data-scroll-hide') === 'true'
    } else if (this.props.scrollHide != null) {
      scrollHide = this.props.scrollHide
    }

    // To prevent previously created timers from triggering
    this.clearTimer()

    this.setState({
      place: e.currentTarget.getAttribute('data-place') || this.props.place || 'top',
      type: e.currentTarget.getAttribute('data-type') || this.props.type || 'dark',
      offset: e.currentTarget.getAttribute('data-offset') || this.props.offset || {},
      delayShow: e.currentTarget.getAttribute('data-delay-show') || this.props.delayShow || 0,
      delayHide: e.currentTarget.getAttribute('data-delay-hide') || this.props.delayHide || 0,
      border: e.currentTarget.getAttribute('data-border')
        ? e.currentTarget.getAttribute('data-border') === 'true'
        : (this.props.border || false),
      extraClass: e.currentTarget.getAttribute('data-class') || this.props.class || this.props.className || ''
    }, () => {
      if (scrollHide) this.addScrollListener(e)
      this.updateTooltip(e)
    })
  }

  /**
   * When mouse hover, updatetooltip
   */
  updateTooltip (e) {
    const {delayShow, show} = this.state
    const {afterShow, children} = this.props
    const delayTime = show ? 0 : parseInt(delayShow, 10)
    const eventTarget = e.currentTarget

    const updateState = () => {
      if (Array.isArray(children) && children.length > 0 || children) {
        const isInvisible = !this.state.show
        this.setState({
          currentEvent: e,
          currentTarget: eventTarget,
          show: true
        }, () => {
          this.updatePosition()
          if (isInvisible && afterShow) afterShow()
        })
      }
    }

    clearTimeout(this.delayShowLoop)
    if (delayShow) {
      this.delayShowLoop = setTimeout(updateState, delayTime)
    } else {
      updateState()
    }
  }

  /**
   * When mouse leave, hide tooltip
   */
  hideTooltip (e, hasTarget) {
    const {delayHide} = this.state
    const {afterHide} = this.props
    if (!this.mount) return

    if (hasTarget) {
      // Don't trigger other elements belongs to other ReactTooltip
      const targetArray = this.getTargetArray(this.props.id)
      const isMyElement = targetArray.some(ele => ele === e.currentTarget)
      if (!isMyElement || !this.state.show) return
    }
    const resetState = () => {
      const isVisible = this.state.show
      this.setState({
        show: false
      }, () => {
        this.removeScrollListener()
        if (isVisible && afterHide) afterHide()
      })
    }

    this.clearTimer()
    if (delayHide) {
      this.delayHideLoop = setTimeout(resetState, parseInt(delayHide, 10))
    } else {
      resetState()
    }
  }

  /**
   * Add scroll eventlistener when tooltip show
   * automatically hide the tooltip when scrolling
   */
  addScrollListener (e) {
    const isCaptureMode = this.isCapture(e.currentTarget)
    window.addEventListener('scroll', this.hideTooltip, isCaptureMode)
  }

  removeScrollListener () {
    window.removeEventListener('scroll', this.hideTooltip)
  }

  // Calculation the position
  updatePosition () {
    const {currentEvent, currentTarget, place, offset} = this.state
    const node = ReactDOM.findDOMNode(this)
    const result = getPosition(currentEvent, currentTarget, node, place, offset)

    if (result.isNewState) {
      // Switch to reverse placement
      return this.setState(result.newState, () => {
        this.updatePosition()
      })
    }
    // Set tooltip position
    node.style.left = result.position.left + 'px'
    node.style.top = result.position.top + 'px'
  }

  /**
   * CLear all kinds of timeout of interval
   */
  clearTimer () {
    clearTimeout(this.delayShowLoop)
    clearTimeout(this.delayHideLoop)
  }

  render () {
    const {extraClass, ariaProps} = this.state
    const {children} = this.props
    let tooltipClass = classname(
      '__react_component_tooltip',
      {'show': this.state.show},
      {'border': this.state.border},
      {'place-top': this.state.place === 'top'},
      {'place-bottom': this.state.place === 'bottom'},
      {'place-left': this.state.place === 'left'},
      {'place-right': this.state.place === 'right'},
      {'type-dark': this.state.type === 'dark'},
      {'type-success': this.state.type === 'success'},
      {'type-warning': this.state.type === 'warning'},
      {'type-error': this.state.type === 'error'},
      {'type-info': this.state.type === 'info'},
      {'type-light': this.state.type === 'light'}
    )

    return (
      <div className={`${tooltipClass} ${extraClass}`}
               {...ariaProps}
               data-id='tooltip'>{children}</div>
    )
  }
}

module.exports = ReactTooltip
