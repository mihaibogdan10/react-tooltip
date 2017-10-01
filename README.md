# This is a simplified version of react-tooltip v3.3.0

The purpose of this repository is to have a compact Toolip component for React.

Below is a list of the remaining options the component accepts:

## Options
Notes:
* The tooltip sets `type: dark` `place: top` as **default** attributes. You don't have to add these options if you don't want to change the defaults
* The option you set on `<ReactTooltip />` component will be implemented on every tooltip in a same page: `<ReactTooltip delayShow="100" />`
* The option you set on a specific element, for example: `<a data-type="warning"></a>` will only affect this specific tooltip

Check example:  [React-tooltip Test](http://wwayne.com/react-tooltip)

Global|Specific	|Type	|Values  |  Description
|:---|:---|:---|:---|:----
 place	|   data-place  |  String  |  top, right, bottom, left | placement
 type	|   data-type  |  String  |  success, warning, error, info, light | theme
 event |   data-event  |  String  |  e.g. click | custom event to trigger tooltip
 eventOff |   data-event-off  |  String  |  e.g. click | custom event to hide tooltip (only makes effect after setting event attribute)
 globalEventOff | | String| e.g. click| global event to hide tooltip (global only)
 isCapture | data-iscapture | Bool | true, false | when set to true, custom event's propagation mode will be capture
 offset	|   data-offset  |  Object  |  top, right, bottom, left | `data-offset="{'top': 10, 'left': 10}"` for specific and `offset={{top: 10, left: 10}}` for global
className	|   data-class  |  String  |   | extra custom class, can use !important to overwrite react-tooltip's default class
 delayHide	|   data-delay-hide  |  Number  |   | `<p data-tip="tooltip" data-delay-hide='1000'></p>` or `<ReactTooltip delayHide={1000} />`
 delayShow	|   data-delay-show  |  Number  |   | `<p data-tip="tooltip" data-delay-show='1000'></p>` or `<ReactTooltip delayShow={1000} />`
 insecure | null | Bool | true, false | Whether to inject the style header into the page dynamically (violates CSP style-src but is a convenient default)
 border  |   data-border  |  Bool  |  true, false | Add one pixel white border
 afterShow | null | Func | () => {} | Function that will be called after tooltip show
 afterHide | null | Func | () => {} | Function that will be called after tooltip hide
 scrollHide | data-scroll-hide | Bool | true, false | Hide the tooltip when scrolling, default is true
 resizeHide | null | Bool | true, false | Hide the tooltip when resizing the window, default is true
 wrapper | null | String | div, span | Selecting the wrapper element of the react tooltip, default is div
