function sendData() {
    Telegram.WebApp.MainButton.setParams({
        is_visible: true,
        text: 'VIEW ORDER',
        color: '#31b545'
      }).hideProgress();
}

function init() {
    $(".order").html("Halo hihihi")
    Telegram.WebApp.ready()
    Telegram.WebApp.MainButton.show()
	Telegram.WebApp.MainButton
        .setText('Ok')
        .onClick(sendData)

}
//
document.addEventListener('DOMContentLoaded', init)