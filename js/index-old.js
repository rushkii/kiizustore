const pricelist = [$(".card")]

function sendData() {
    Telegram.WebApp.MainButton.setParams({
        is_visible: true,
        text: 'OK',
        color: '#31b545'
      }).show();
}

function getOrder(index) {
    let selected = $(".card")[index]
    $(".card").remove()
    $(".container").append(selected)
    $(".card .contentBx a").html("Cancel")
    $(".card .contentBx a").attr("onClick", "cancelOrder()")
    Telegram.WebApp.MainButton.setParams({
        is_visible: true,
        text: 'ORDER',
        color: '#31b545'
      }).onClick(sendData);
}

function cancelOrder() {
    console.log(pricelist.length)
    $(".container").append(pricelist)
}

$(document).ready(() => {
    Telegram.WebApp.ready()
})