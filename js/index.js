function sendData() {
    Telegram.WebApp.MainButton.setParams({
        is_visible: true,
        text: 'OK',
        color: '#31b545'
      }).show();
}

function getOrder() {
    Telegram.WebApp.MainButton.show()
	Telegram.WebApp.MainButton.setParams({
        is_visible: true,
        text: 'VIEW ORDER',
        color: '#31b545'
      }).onClick(sendData);
}

function init() {
    Telegram.WebApp.ready()
}

document.addEventListener('DOMContentLoaded', init)