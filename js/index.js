function sendData() {
    Telegram.WebApp.MainButton.setParams({
        is_visible: true,
        text: 'OK',
        color: '#31b545'
      }).show();
}

function init() {
    $(".order").html("Halo hihihi")
    Telegram.WebApp.ready()
    Telegram.WebApp.MainButton.show()
	Telegram.WebApp.MainButton.setParams({
        is_visible: true,
        text: 'VIEW ORDER',
        color: '#31b545'
      }).onClick(sendData);

}
//
document.addEventListener('DOMContentLoaded', init)