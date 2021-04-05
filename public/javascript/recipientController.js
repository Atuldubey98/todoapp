var form = document.getElementById("form__chat");
var chats = document.getElementsByClassName("chats")[0];
var chat__items = document.getElementsByClassName("chat__item");

form.onsubmit = function(e){
	e.preventDefault();
	var inputItem = document.getElementsByName("input")[0].value;
	const msg = {
		message: inputItem,
		from : document.getElementsByClassName("chat__items")[0].id,
		to: document.getElementsByClassName("chat__body")[0].id,
		chatid: getChatId(document.getElementsByClassName("chat__items")[0].id,document.getElementsByClassName("chat__body")[0].id)
	}
	socket.emit("message", msg);
	document.getElementsByName("input")[0].value = "";
}

function getChatId(chatid1, chatid2)
{
	return chatid2 < chatid1 ? chatid2.toString() + chatid1.toString() : chatid1.toString() + chatid2.toString();
}

function removeActive()
{
	for (var i = 0; i < chat__items.length; i++) {
		chat__items[i].classList.remove("active");
	}
}

window.onload = function(){
	for (var i = 0; i < chat__items.length; i++) {
		chat__items[i].addEventListener("click", (e)=>{

			if (e.target.id != undefined || e.target.id != "" || document.getElementsByClassName("chat__items")[0].id != "") {
				while(chats.firstChild)
				{
					chats.removeChild(chats.firstChild);
				}
				removeActive();
				document.getElementById("form__chat").style.display = "flex";
				e.target.classList.add("active");
				document.getElementsByClassName("chat__body")[0].id = e.target.id;
				var chatId = getChatId(e.target.id, document.getElementsByClassName("chat__items")[0].id);
				const url = "http://localhost:3000/chats/" + chatId;
				const otherParams = {
					headers: {
						'Content-Type': 'application/json'
					},
					method: "GET"
				}
			
			 	fetch(url, otherParams)
				.then(response=>response.json())
				.then(data=>{
					if (data) {
						console.log(data.from_id);
						for (var i = 0; i < data.chats.length; i++) {
							var divchat = document.createElement("div");
							divchat.classList.add("chat__message")
							if (data.chats[i].from_id == e.target.id) {
								divchat.classList.add("align__right");
							}else{
								divchat.classList.add("align__left")
							}
							var textNode = document.createTextNode(data.chats[i].message);
							divchat.appendChild(textNode);
							chats.appendChild(divchat);
							chats.scrollTop = chats.scrollHeight;
						}
					}
				})
			}
		})
	}
}