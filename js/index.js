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
    Telegram.WebApp.ready();
    Kiizustore.apiUrl = "https://kiizustore.herokuapp.com/api";
    Kiizustore.userId = options.userId;
    Kiizustore.userHash = options.userHash;
    $('body').show();
    if (!Telegram.WebApp.initDataUnsafe ||
      !Telegram.WebApp.initDataUnsafe.query_id) {
      Kiizustore.isClosed = true;
      $('body').addClass('closed');
      Kiizustore.showStatus('Kiizuha Store sedang tutup, coba kembali beberapa saat.');
      return;
    }
    $('.js-item-incr-btn').on('click', Kiizustore.eIncrClicked);
    $('.js-item-decr-btn').on('click', Kiizustore.eDecrClicked);
    $('.js-order-edit').on('click', Kiizustore.eEditClicked);
    $('.js-order-uid-input').on('change', Kiizustore.onTypingListen);
    $('.js-order-server-input').on('change', Kiizustore.onTypingListen);
    $('.js-status').on('click', Kiizustore.eStatusClicked);
    $('.text-field').on('input', (e) => {
      if (e.value.length > e.maxLength) e.value = e.value.slice(0, e.maxLength);
    })
    Telegram.WebApp.MainButton.setParams({
      text_color: '#fff'
    }).onClick(Kiizustore.mainBtnClicked);
    Telegram.WebApp.BackButton.onClick(Kiizustore.backBtnClicked);
    Telegram.WebApp.setHeaderColor('bg_color');
    initRipple();
  },
  eIncrClicked: function(e) {
    e.preventDefault();
    Telegram.WebApp.HapticFeedback.impactOccurred('light');
    var itemEl = $(this).parents('.js-item');
    Kiizustore.incrClicked(itemEl, 1);
  },
  eDecrClicked: function(e) {
    e.preventDefault();
    Telegram.WebApp.HapticFeedback.impactOccurred('light');
    var itemEl = $(this).parents('.js-item');
    Kiizustore.incrClicked(itemEl, -1);
  },
  eEditClicked: function(e) {
    e.preventDefault();
    Kiizustore.toggleMode(false);
  },
  backBtnClicked: function() {
    Kiizustore.toggleMode(false);
  },
  getOrderItem: function(itemEl) {
    var id = itemEl.data('item-id');
    return $('.js-order-item').filter(function() {
      return ($(this).data('item-id') == id);
    });
  },
  onTypingListen: () => {
    console.log(Kiizustore.canPay)
    if ($(".js-order-uid-input").val() != "" && $(".js-order-server-input").val() != "") {
      // Kiizustore.validateForm();
      Kiizustore.canPay = true
      Kiizustore.updateMainButton()
    }
  },
  validateForm: () => {
    let params = {
      uid: 830443653,
      server: "os_asia"
    }
    Kiizustore.apiRequest('/validate', params, function(result) {
      if (result.ok) {
        mainButton.setParams({
          is_visible: !!Kiizustore.canPay,
          text: 'BAYAR ' + Kiizustore.formatPrice(Kiizustore.totalPrice),
          color: css.getPropertyValue('--main-color'),
          text_color: css.getPropertyValue('--bg-color')
        }).hideProgress();
      }
    })
  },
  updateItem: function(itemEl, delta) {
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
  updateBackgroundColor: function() {
    var style = window.getComputedStyle(document.body);
    var bg_color = parseColorToHex(style.backgroundColor || '#fff');
    Telegram.WebApp.setBackgroundColor(bg_color);
  },
  updateMainButton: function() {
    var mainButton = Telegram.WebApp.MainButton;
    let css = window.getComputedStyle(document.body);
    if (Kiizustore.modeOrder) {
      if (Kiizustore.isLoading) {
        mainButton.setParams({
          is_visible: true,
          color: css.getPropertyValue('--page-hint-color'),
          is_active: false
        }).showProgress();
      } else {
        mainButton.setParams({
          is_visible: !!Kiizustore.canPay,
          text: 'BAYAR ' + Kiizustore.formatPrice(Kiizustore.totalPrice),
          color: css.getPropertyValue('--main-color'),
          text_color: css.getPropertyValue('--bg-color')
        }).hideProgress();
      }
    } else {
      mainButton.setParams({
        is_visible: !!Kiizustore.canPay,
        text: 'LIHAT PESANAN',
        color: css.getPropertyValue('--main-color'),
        text_color: css.getPropertyValue('--block-bg-color')
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
    // Kiizustore.canPay = total_price > 0;
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
      Telegram.WebApp.expand();
      Telegram.WebApp.BackButton.show();
    }else{
      $('body').removeClass('order-mode');
      setTimeout(function() {
        $('.items').css('maxHeight', '');
        $('.order-overview').hide();
      }, anim_duration);
      Telegram.WebApp.BackButton.hide();
    }
    Kiizustore.updateBackgroundColor();
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
      var uid = $('.js-order-uid-input').val();
      var server = $('.js-order-server-input').val();
      var params = {
        uid: uid,
        server: server
      };
      if (Kiizustore.userId && Kiizustore.userHash) {
        params.user_id = Kiizustore.userId;
        params.user_hash = Kiizustore.userHash;
      }
      var invoiceSupported = Telegram.WebApp.isVersionAtLeast('6.1');
      if (invoiceSupported) {
        params.invoice = 1;
      }
      Kiizustore.toggleLoading(true);
      Kiizustore.apiRequest('makeOrder', params, function(result) {
        Kiizustore.toggleLoading(false);
        if (result.ok) {
          if (invoiceSupported) {
            Telegram.WebApp.openInvoice(result.invoice_url, function(status) {
              if (status == 'paid') {
                Telegram.WebApp.close();
              } else if (status == 'failed') {
                Telegram.WebApp.HapticFeedback.notificationOccurred('error');
                Kiizustore.showStatus('Payment has been failed.');
              } else {
                Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
                Kiizustore.showStatus('You have cancelled this order.');
              }
            });
          } else {
            Telegram.WebApp.close();
          }
        }
        if (result.error) {
          Telegram.WebApp.HapticFeedback.notificationOccurred('error');
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

function parseColorToHex(color) {
  color += '';
  var match;
  if (match = /^\s*#([0-9a-f]{6})\s*$/i.exec(color)) {
    return '#' + match[1].toLowerCase();
  }
  else if (match = /^\s*#([0-9a-f])([0-9a-f])([0-9a-f])\s*$/i.exec(color)) {
    return ('#' + match[1] + match[1] + match[2] + match[2] + match[3] + match[3]).toLowerCase();
  }
  else if (match = /^\s*rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+\.{0,1}\d*))?\)\s*$/.exec(color)) {
    var r = parseInt(match[1]), g = parseInt(match[2]), b = parseInt(match[3]);
    r = (r < 16 ? '0' : '') + r.toString(16);
    g = (g < 16 ? '0' : '') + g.toString(16);
    b = (b < 16 ? '0' : '') + b.toString(16);
    return '#' + r + g + b;
  }
  return false;
}

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