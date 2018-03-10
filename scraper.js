const fs = require('fs');
var osmosis = require("osmosis");
var url = require("url");

const directory = 'data';
const prices = [];
const descriptions = [];
const imageUrls = [];
const pageUrls = [];

//Checks whether or not 'data' directory exists. If not, said directory is created.
if(!fs.existsSync(directory)) {
	fs.mkdirSync(directory);
}

//Goes to 'http://shirts4mike.com/', goes to t-shirts catalogue page, finds and returns
//t-shirt info for each t-shirt in catalogue.
osmosis
	.get('http://shirts4mike.com/')
	.find('li.shirts > a')
	// .set('location')
	.follow('@href')
	.find('div.shirts > div.wrapper > ul > li > a')
	.set('location')
	.follow('@href')
	.set({
	    'price':        '.price',
	    'description':  'div.shirt-details > h1',
			'imageUrl':       'img@src'
	})
	.then(function(window) {
		let url = window.location.href;
		pageUrls.push(url);
	})
	.data(function(tShirtInfo) {
		 prices.push(tShirtInfo.price);
		 descriptions.push(tShirtInfo.description);
		 imageUrls.push(tShirtInfo.imageUrl);
	})
	// .log(console.log)
	// .error(console.log)
	// .debug(console.log)

setTimeout(printInfo, 5000);

function printInfo() {
	let tShirt = 1;
	prices.forEach(function(price) {
		console.log("TShirt " + tShirt);
		console.log("Price: " + price);
		console.log("Description: " + descriptions[tShirt - 1]);
		console.log("PageURL: " + pageUrls[tShirt - 1]);
		console.log("ImageURL: " + imageUrls[tShirt - 1] + "\n");
		tShirt++;
	});
}
