function init() {
    Telegram.WebApp.ready()
    Telegram.WebApp.MainButton.show()
	Telegram.WebApp.MainButton.setText('Ok')
    Telegram.WebApp.sendData('test_data')
}

document.addEventListener('DOMContentLoaded', init)