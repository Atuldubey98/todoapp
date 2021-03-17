var items = document.getElementsByClassName("item");

window.onload = function (){
	clickEventToItems();
}
function search()
{
	if (document.getElementsByName("Search").item(0).value != "") {
		location.href = "/search/" + 	document.getElementsByName("Search").item(0).value;
	}else{
		location.href = "/"
	}
}
function clickEventToItems() {
	for (var i = 0; i < items.length; i++) {
		
		items[i].addEventListener("click", (e)=>{
		var id = e.target.attributes.id.value;
		const url = "http://localhost:3000/delete/"+id;
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
				let body = document.getElementsByClassName("body").item(0);
				let node = document.getElementById(data.id);
				if (body.contains(node)) {
					document.getElementsByClassName("body").item(0).removeChild(node);
				}			
			}
		})
	});
   }
}
function addTodoItem(){
	var valueInput = document.getElementById("inputTodo").value;
	if (valueInput!="") {
		const url = "http://localhost:3000"
		const data = {
			item : valueInput
		}
		const otherParams = {
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data),
			method: "POST"
		}
		fetch(url, otherParams).then(response=>response.json()).then(data=>{
			document.getElementById("inputTodo").value = "";
			console.log(data);
			if (data) {
			var textNode = document.createTextNode(valueInput);
			var div = document.createElement("div");
			div.id = data.id;
			items = document
					.getElementsByClassName("item");
			div
			.classList
			.add("item")
			div
			.appendChild(textNode);
			document
			.getElementsByClassName("body")
			.item(0)
			.appendChild(div);
			clickEventToItems();
			}
		}).catch(err=>console.log(err));
	}		
}