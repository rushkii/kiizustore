(function($) {
    $.fn.redraw = function() {
      return this.map(function(){ this.offsetTop; return this; });
    };
  })(jQuery);
  
  var Kiizustore = {
    canPay: false,
    modeOrder: false,
    totalPrice: 0,
  
    init: function(options) {
      console.log("READY")
      Telegram.WebApp.ready();
      Kiizustore.apiUrl = options.apiUrl;
      Kiizustore.userId = options.userId;
      Kiizustore.userHash = options.userHash;
      var userId = Telegram.WebApp.initData && Telegram.WebApp.initData.user && Telegram.WebApp.initData.user.id || Kiizustore.userId;
      console.log(userId)
      if(options.debug) {
        var userId = 5287896013; 
      }
      $('body').show();
      if (!userId) {
        Kiizustore.isClosed = true;
        $('body').addClass('closed');
        Kiizustore.showStatus('Kiizuha Store sedang tutup, coba kembali beberapa saat.');
        return;
      }
      $('.js-item-incr-btn').on('click', Kiizustore.eIncrClicked);
      $('.js-item-decr-btn').on('click', Kiizustore.eDecrClicked);
      $('.js-order-edit').on('click', Kiizustore.eEditClicked);
      $('.js-status').on('click', Kiizustore.eStatusClicked);
      $('.js-order-comment-field').each(function() {
        autosize(this);
      });
      Telegram.WebApp.MainButton.setParams({
        text_color: '#fff'
      }).onClick(Kiizustore.mainBtnClicked);
      initRipple();
    },
    eIncrClicked: function(e) {
      console.log("eIncrClicked")
      // e.preventDefault();
      var itemEl = $(this).parents('.js-item');
      Kiizustore.incrClicked(itemEl, 1);
    },
    eDecrClicked: function(e) {
      // e.preventDefault();
      var itemEl = $(this).parents('.js-item');
      Kiizustore.incrClicked(itemEl, -1);
    },
    eEditClicked: function(e) {
      // e.preventDefault();
      Kiizustore.toggleMode(false);
    },
    getOrderItem: function(itemEl) {
      console.log("getOrderItem")
      var id = itemEl.data('item-id');
      return $('.js-order-item').filter(function() {
        return ($(this).data('item-id') == id);
      });
    },
    updateItem: function(itemEl, delta) {
      console.log("updateItem")
      var price = +itemEl.data('item-price');
      var count = +itemEl.data('item-count') || 0;
      var counterEl = $('.js-item-counter', itemEl);
      counterEl.text(count ? count : 1);
      var isSelected = itemEl.hasClass('selected');
      var anim_name = isSelected ? (delta > 0 ? 'badge-incr' : (count > 0 ? 'badge-decr' : 'badge-hide')) : 'badge-show';
      var cur_anim_name = counterEl.css('animation-name');
      if ((anim_name == 'badge-incr' || anim_name == 'badge-decr') && anim_name == cur_anim_name) {
        anim_name += '2';
      }
      counterEl.css('animation-name', anim_name);
      itemEl.toggleClass('selected', count > 0);
  
      var orderItemEl = Kiizustore.getOrderItem(itemEl);
      var orderCounterEl = $('.js-order-item-counter', orderItemEl);
      orderCounterEl.text(count ? count : 1);
      orderItemEl.toggleClass('selected', count > 0);
      var orderPriceEl = $('.js-order-item-price', orderItemEl);
      var item_price = count * price;
      orderPriceEl.text(Kiizustore.formatPrice(item_price));
  
      Kiizustore.updateTotalPrice();
    },
    incrClicked: function(itemEl, delta) {
      console.log("incrClicked")
      if (Kiizustore.isLoading || Kiizustore.isClosed) {
        return false;
      }
      var count = +itemEl.data('item-count') || 0;
      count += delta;
      if (count < 0) {
        count = 0;
      }
      itemEl.data('item-count', count);
      Kiizustore.updateItem(itemEl, delta);
    },
    formatPrice: function(price) {
      return 'Rp' + price.toLocaleString("id-ID");
    },
    updateMainButton: function() {
      var mainButton = Telegram.WebApp.MainButton;
      if (Kiizustore.modeOrder) {
        if (Kiizustore.isLoading) {
          mainButton.setParams({
            is_visible: true,
            color: '#65c36d'
          }).showProgress();
        } else {
          mainButton.setParams({
            is_visible: !!Kiizustore.canPay,
            text: 'PAY ' + Kiizustore.formatPrice(Kiizustore.totalPrice),
            color: '#31b545'
          }).hideProgress();
        }
      } else {
        mainButton.setParams({
          is_visible: !!Kiizustore.canPay,
          text: 'VIEW ORDER',
          color: '#31b545'
        }).hideProgress();
      }
    },
    updateTotalPrice: function() {
      var total_price = 0;
      $('.js-item').each(function() {
        var itemEl = $(this)
        var price = +itemEl.data('item-price');
        var count = +itemEl.data('item-count') || 0;
        total_price += price * count;
      });
      Kiizustore.canPay = total_price > 0;
      Kiizustore.totalPrice = total_price;
      Kiizustore.updateMainButton();
    },
    getOrderData: function() {
      var order_data = [];
      $('.js-item').each(function() {
        var itemEl = $(this)
        var id    = itemEl.data('item-id');
        var count = +itemEl.data('item-count') || 0;
        if (count > 0) {
          order_data.push({id: id, count: count});
        }
      });
      return JSON.stringify(order_data);
    },
    toggleMode: function(mode_order) {
      Kiizustore.modeOrder = mode_order;
      var anim_duration, match;
      try {
        anim_duration = window.getComputedStyle(document.body).getPropertyValue('--page-animation-duration');
        if (match = /([\d\.]+)(ms|s)/.exec(anim_duration)) {
          anim_duration = +match[1];
          if (match[2] == 's') {
            anim_duration *= 1000;
          }
        } else {
          anim_duration = 400;
        }
      } catch (e) {
        anim_duration = 400;
      }
      if (mode_order) {
        var height = $('.items').height();
        $('.order-overview').show();
        $('.items').css('maxHeight', height).redraw();
        $('body').addClass('order-mode');
        $('.js-order-comment-field').each(function() {
          autosize.update(this);
        });
        Telegram.WebApp.expand();
        $('body').removeClass('order-mode');
        setTimeout(function() {
          $('.items').css('maxHeight', '');
          $('.order-overview').hide();
        }, anim_duration);
      }
      Kiizustore.updateMainButton();
    },
    toggleLoading: function(loading) {
      Kiizustore.isLoading = loading;
      Kiizustore.updateMainButton();
      $('body').toggleClass('loading', !!Kiizustore.isLoading);
      Kiizustore.updateTotalPrice();
    },
    mainBtnClicked: function() {
      if (!Kiizustore.canPay || Kiizustore.isLoading || Kiizustore.isClosed) {
        return false;
      }
      if (Kiizustore.modeOrder) {
        var comment = $('.js-order-comment-field').val();
        var params = {
          order_data: Kiizustore.getOrderData(),
          comment: comment
        };
        if (!Telegram.WebApp.initData ||
            !Telegram.WebApp.initData.user ||
            !Telegram.WebApp.initData.user.id) {
          params.user_id = Kiizustore.userId;
          params.user_hash = Kiizustore.userHash;
        }
        Kiizustore.toggleLoading(true);
        Kiizustore.apiRequest('makeOrder', params, function(result) {
          Kiizustore.toggleLoading(false);
          if (result.ok) {
            Telegram.WebApp.close();
          }
          if (result.error) {
            Kiizustore.showStatus(result.error);
          }
        });
      } else {
        Kiizustore.toggleMode(true);
      }
    },
    eStatusClicked: function() {
      Kiizustore.hideStatus();
    },
    showStatus: function(text) {
      clearTimeout(Kiizustore.statusTo);
      $('.js-status').text(text).addClass('shown');
      if (!Kiizustore.isClosed) {
        Kiizustore.statusTo = setTimeout(function(){ Kiizustore.hideStatus(); }, 2500);
      }
    },
    hideStatus: function() {
      clearTimeout(Kiizustore.statusTo);
      $('.js-status').removeClass('shown');
    },
    apiRequest: function(method, data, onCallback) {
      var authData = Telegram.WebApp.initDataRaw || '';
      $.ajax(Kiizustore.apiUrl, {
        type: 'POST',
        data: $.extend(data, {_auth: authData, method: method}),
        dataType: 'json',
        xhrFields: {
          withCredentials: true
        },
        success: function(result) {
          onCallback && onCallback(result);
        },
        error: function(xhr) {
          onCallback && onCallback({error: 'Server error'});
        }
      });
    }
  };
  
  /*!
    Autosize 3.0.20
    license: MIT
    http://www.jacklmoore.com/autosize
  */
  !function(e,t){if("function"==typeof define&&define.amd)define(["exports","module"],t);else if("undefined"!=typeof exports&&"undefined"!=typeof module)t(exports,module);else{var n={exports:{}};t(n.exports,n),e.autosize=n.exports}}(this,function(e,t){"use strict";function n(e){function t(){var t=window.getComputedStyle(e,null);"vertical"===t.resize?e.style.resize="none":"both"===t.resize&&(e.style.resize="horizontal"),s="content-box"===t.boxSizing?-(parseFloat(t.paddingTop)+parseFloat(t.paddingBottom)):parseFloat(t.borderTopWidth)+parseFloat(t.borderBottomWidth),isNaN(s)&&(s=0),l()}function n(t){var n=e.style.width;e.style.width="0px",e.offsetWidth,e.style.width=n,e.style.overflowY=t}function o(e){for(var t=[];e&&e.parentNode&&e.parentNode instanceof Element;)e.parentNode.scrollTop&&t.push({node:e.parentNode,scrollTop:e.parentNode.scrollTop}),e=e.parentNode;return t}function r(){var t=e.style.height,n=o(e),r=document.documentElement&&document.documentElement.scrollTop;e.style.height="auto";var i=e.scrollHeight+s;return 0===e.scrollHeight?void(e.style.height=t):(e.style.height=i+"px",u=e.clientWidth,n.forEach(function(e){e.node.scrollTop=e.scrollTop}),void(r&&(document.documentElement.scrollTop=r)))}function l(){r();var t=Math.round(parseFloat(e.style.height)),o=window.getComputedStyle(e,null),i=Math.round(parseFloat(o.height));if(i!==t?"visible"!==o.overflowY&&(n("visible"),r(),i=Math.round(parseFloat(window.getComputedStyle(e,null).height))):"hidden"!==o.overflowY&&(n("hidden"),r(),i=Math.round(parseFloat(window.getComputedStyle(e,null).height))),a!==i){a=i;var l=d("autosize:resized");try{e.dispatchEvent(l)}catch(e){}}}if(e&&e.nodeName&&"TEXTAREA"===e.nodeName&&!i.has(e)){var s=null,u=e.clientWidth,a=null,p=function(){e.clientWidth!==u&&l()},c=function(t){window.removeEventListener("resize",p,!1),e.removeEventListener("input",l,!1),e.removeEventListener("keyup",l,!1),e.removeEventListener("autosize:destroy",c,!1),e.removeEventListener("autosize:update",l,!1),Object.keys(t).forEach(function(n){e.style[n]=t[n]}),i.delete(e)}.bind(e,{height:e.style.height,resize:e.style.resize,overflowY:e.style.overflowY,overflowX:e.style.overflowX,wordWrap:e.style.wordWrap});e.addEventListener("autosize:destroy",c,!1),"onpropertychange"in e&&"oninput"in e&&e.addEventListener("keyup",l,!1),window.addEventListener("resize",p,!1),e.addEventListener("input",l,!1),e.addEventListener("autosize:update",l,!1),e.style.overflowX="hidden",e.style.wordWrap="break-word",i.set(e,{destroy:c,update:l}),t()}}function o(e){var t=i.get(e);t&&t.destroy()}function r(e){var t=i.get(e);t&&t.update()}var i="function"==typeof Map?new Map:function(){var e=[],t=[];return{has:function(t){return e.indexOf(t)>-1},get:function(n){return t[e.indexOf(n)]},set:function(n,o){e.indexOf(n)===-1&&(e.push(n),t.push(o))},delete:function(n){var o=e.indexOf(n);o>-1&&(e.splice(o,1),t.splice(o,1))}}}(),d=function(e){return new Event(e,{bubbles:!0})};try{new Event("test")}catch(e){d=function(e){var t=document.createEvent("Event");return t.initEvent(e,!0,!1),t}}var l=null;"undefined"==typeof window||"function"!=typeof window.getComputedStyle?(l=function(e){return e},l.destroy=function(e){return e},l.update=function(e){return e}):(l=function(e,t){return e&&Array.prototype.forEach.call(e.length?e:[e],function(e){return n(e,t)}),e},l.destroy=function(e){return e&&Array.prototype.forEach.call(e.length?e:[e],o),e},l.update=function(e){return e&&Array.prototype.forEach.call(e.length?e:[e],r),e}),t.exports=l});
  
  /* Ripple */
  
  function initRipple() {
    if (!document.querySelectorAll) return;
    var rippleHandlers = document.querySelectorAll('.ripple-handler');
    var redraw = function(el) { el.offsetTop + 1; }
    var isTouch = ('ontouchstart' in window);
    for (var i = 0; i < rippleHandlers.length; i++) {
      (function(rippleHandler) {
        function onRippleStart(e) {
          var rippleMask = rippleHandler.querySelector('.ripple-mask');
          if (!rippleMask) return;
          var rect = rippleMask.getBoundingClientRect();
          if (e.type == 'touchstart') {
            var clientX = e.targetTouches[0].clientX;
            var clientY = e.targetTouches[0].clientY;
          } else {
            var clientX = e.clientX;
            var clientY = e.clientY;
          }
          var rippleX = (clientX - rect.left) - rippleMask.offsetWidth / 2;
          var rippleY = (clientY - rect.top) - rippleMask.offsetHeight / 2;
          var ripple = rippleHandler.querySelector('.ripple');
          ripple.style.transition = 'none';
          redraw(ripple);
          ripple.style.transform = 'translate3d(' + rippleX + 'px, ' + rippleY + 'px, 0) scale3d(0.2, 0.2, 1)';
          ripple.style.opacity = 1;
          redraw(ripple);
          ripple.style.transform = 'translate3d(' + rippleX + 'px, ' + rippleY + 'px, 0) scale3d(1, 1, 1)';
          ripple.style.transition = '';
  
          function onRippleEnd(e) {
            ripple.style.transitionDuration = 'var(--ripple-end-duration, .2s)';
            ripple.style.opacity = 0;
            if (isTouch) {
              document.removeEventListener('touchend', onRippleEnd);
              document.removeEventListener('touchcancel', onRippleEnd);
            } else {
              document.removeEventListener('mouseup', onRippleEnd);
            }
          }
          if (isTouch) {
            document.addEventListener('touchend', onRippleEnd);
            document.addEventListener('touchcancel', onRippleEnd);
          } else {
            document.addEventListener('mouseup', onRippleEnd);
          }
        }
        if (isTouch) {
          rippleHandler.removeEventListener('touchstart', onRippleStart);
          rippleHandler.addEventListener('touchstart', onRippleStart);
        } else {
          rippleHandler.removeEventListener('mousedown', onRippleStart);
          rippleHandler.addEventListener('mousedown', onRippleStart);
        }
      })(rippleHandlers[i]);
    }
  }