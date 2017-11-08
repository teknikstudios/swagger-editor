var React = require('react');
var insertKeyframesRule = require('domkit/insertKeyframesRule');
var transitionEvents = require('domkit/transitionEvents');
var appendVendorPrefix = require('domkit/appendVendorPrefix');

var modalFactory = function(animation){

    return React.createClass({
        propTypes: {
            className: React.PropTypes.string,
            // Close the modal when esc is pressed? Defaults to true.
            keyboard: React.PropTypes.bool,
            onShow: React.PropTypes.func,
            onHide: React.PropTypes.func,
            animation: React.PropTypes.object,
            backdrop: React.PropTypes.bool,
            closeOnClick: React.PropTypes.bool,
            modalStyle: React.PropTypes.object,
            backdropStyle: React.PropTypes.object,
            contentStyle: React.PropTypes.object,
        },

        getDefaultProps: function() {
            return {
                className: "",
                onShow: function(){},
                onHide: function(){},
                animation: animation,
                keyboard: true,
                backdrop: true,
                closeOnClick: true,
                modalStyle: {},
                backdropStyle: {},
                contentStyle: {},
            };
        },

        getInitialState: function(){
            return {
                willHidden: false,
                hidden: true
            }
        },

        hasHidden: function(){
            return this.state.hidden;
        },

        addTransitionListener: function(node, handle){
            if (node) {
              var endListener = function(e) {
                  if (e && e.target !== node) {
                      return;
                  }
                  transitionEvents.removeEndEventListener(node, endListener);
                  handle();
              };
              transitionEvents.addEndEventListener(node, endListener);
            }
        },

        handleBackdropClick: function() {
            if (this.props.closeOnClick) {
                this.hide();
            }
        },

        render: function() {

            var hidden = this.hasHidden();
            if (hidden) return null;

            var willHidden = this.state.willHidden;
            var animation = this.props.animation;
            var modalStyle = animation.getModalStyle(willHidden);
            var backdropStyle = animation.getBackdropStyle(willHidden);
            var contentStyle = animation.getContentStyle(willHidden);
            var ref = animation.getRef(willHidden);
            var sharp = animation.getSharp && animation.getSharp(willHidden);

            // Apply custom style properties
            if (this.props.modalStyle) {
                var prefixedModalStyle = appendVendorPrefix(this.props.modalStyle);
                for (var style in prefixedModalStyle) {
                    modalStyle[style] = prefixedModalStyle[style];
                }
            }

            if (this.props.backdropStyle) {
              var prefixedBackdropStyle = appendVendorPrefix(this.props.backdropStyle);
                for (var style in prefixedBackdropStyle) {
                    backdropStyle[style] = prefixedBackdropStyle[style];
                }
            }

            if (this.props.contentStyle) {
              var prefixedContentStyle = appendVendorPrefix(this.props.contentStyle);
                for (var style in prefixedContentStyle) {
                    contentStyle[style] = prefixedContentStyle[style];
                }
            }

            var backdrop = this.props.backdrop? React.createElement("div", {style: backdropStyle, onClick: this.props.closeOnClick? this.handleBackdropClick: null}): undefined;

            if(willHidden) {
                var node = this.refs[ref];
                this.addTransitionListener(node, this.leave);
            }

            return (React.createElement("span", null,
                React.createElement("div", {ref: "modal", style: modalStyle, className: this.props.className},
                    sharp,
                    React.createElement("div", {ref: "content", tabIndex: "-1", style: contentStyle},
                        this.props.children
                    )
                ),
                backdrop
             ))
            ;
        },

        leave: function(){
            this.setState({
                hidden: true
            });
            this.props.onHide();
        },

        enter: function(){
            this.props.onShow();
        },

        show: function(){
            if (!this.hasHidden()) return;

            this.setState({
                willHidden: false,
                hidden: false
            });

            setTimeout(function(){
              var ref = this.props.animation.getRef();
              var node = this.refs[ref];
              this.addTransitionListener(node, this.enter);
            }.bind(this), 0);
        },

        hide: function(){
            if (this.hasHidden()) return;

            this.setState({
                willHidden: true
            });
        },

        toggle: function(){
            if (this.hasHidden())
                this.show();
            else
                this.hide();
        },

        listenKeyboard: function(event) {
            if (this.props.keyboard &&
                    (event.key === "Escape" ||
                     event.keyCode === 27)) {
                this.hide();
            }
        },

        componentDidMount: function(){
            window.addEventListener("keydown", this.listenKeyboard, true);
        },

        componentWillUnmount: function() {
            window.removeEventListener("keydown", this.listenKeyboard, true);
        }
    });
}



var animation = {
  show: {
      animationDuration: '0.4s',
      animationTimingFunction: 'cubic-bezier(0.7,0,0.3,1)'
  },

  hide: {
      animationDuration: '0.4s',
      animationTimingFunction: 'cubic-bezier(0.7,0,0.3,1)'
  },

  showModalAnimation: insertKeyframesRule({
      '0%': {
          opacity: 0,
          transform: 'translate3d(-50%, -300px, 0)'
      },
      '100%': {
          opacity: 1,
          transform: 'translate3d(-50%, -50%, 0)'
      }
  }),

  hideModalAnimation: insertKeyframesRule({
      '0%': {
          opacity: 1,
          transform: 'translate3d(-50%, -50%, 0)'
      },
      '100%': {
          opacity: 0,
          transform: 'translate3d(-50%, 100px, 0)'
      }
  }),

  showBackdropAnimation: insertKeyframesRule({
      '0%': {
          opacity: 0
      },
      '100%': {
          opacity: 0.9
      }
  }),

  hideBackdropAnimation: insertKeyframesRule({
      '0%': {
          opacity: 0.9
      },
      '100%': {
          opacity: 0
      }
  }),

  showContentAnimation: insertKeyframesRule({
      '0%': {
          opacity: 0,
          transform: 'translate3d(0, -20px, 0)'
      },
      '100%': {
          opacity: 1,
          transform: 'translate3d(0, 0, 0)'
      }
  }),

  hideContentAnimation: insertKeyframesRule({
      '0%': {
          opacity: 1,
          transform: 'translate3d(0, 0, 0)'
      },
      '100%': {
          opacity: 0,
          transform: 'translate3d(0, 50px, 0)'
      }
  })
};

var showAnimation = animation.show;
var hideAnimation = animation.hide;
var showModalAnimation = animation.showModalAnimation;
var hideModalAnimation = animation.hideModalAnimation;
var showBackdropAnimation = animation.showBackdropAnimation;
var hideBackdropAnimation = animation.hideBackdropAnimation;
var showContentAnimation = animation.showContentAnimation;
var hideContentAnimation = animation.hideContentAnimation;

module.exports = modalFactory({
  getRef: function(willHidden) {
      return 'modal';
  },
  getModalStyle: function(willHidden) {
      return appendVendorPrefix({
          position: "fixed",
          width: "100%",
          height: "100%",
          transform: "translate3d(-50%, -50%, 0)",
          top: "50%",
          left: "50%",
          backgroundColor: "white",
          zIndex: 1050,
          animationDuration: (willHidden ? hideAnimation : showAnimation).animationDuration,
          animationFillMode: 'forwards',
          animationName: willHidden ? hideModalAnimation : showModalAnimation,
          animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
      })
  },
  getBackdropStyle: function(willHidden) {
      return appendVendorPrefix({
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          zIndex: 1040,
          backgroundColor: "#373A47",
          animationDuration: (willHidden ? hideAnimation : showAnimation).animationDuration,
          animationFillMode: 'forwards',
          animationName: willHidden ? hideBackdropAnimation : showBackdropAnimation,
          animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
      });
  },
  getContentStyle: function(willHidden) {
      return appendVendorPrefix({
          margin: 0,
          opacity: 0,
          backgroundColor: "white",
          width: '100%',
          padding: '20px',
          animationDuration: (willHidden ? hideAnimation : showAnimation).animationDuration,
          animationFillMode: 'forwards',
          animationDelay: '0.25s',
          animationName: showContentAnimation,
          animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
      })
  }
});
