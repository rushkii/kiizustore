function sendData() {
    Telegram.WebApp.sendData('test_data')
}

function init() {
    Telegram.WebApp.ready()
    Telegram.WebApp.MainButton.show()
	Telegram.WebApp.MainButton
        .setText('Ok')
        .onClick(sendData)

}
//
document.addEventListener('DOMContentLoaded', init)