const createCsvWriter = require('csv-writer').createArrayCsvWriter;
const fs = require('fs');
const osmosis = require("osmosis");

const directory = 'data';
const prices = [];
const descriptions = [];
const imageUrls = [];
const pageUrls = [];
const csvData = [];
let tempArray = [];

//Checks whether or not 'data' directory exists. If not, said directory is created.
if(!fs.existsSync(directory)) {
	fs.mkdirSync(directory);
}

//Goes to 'http://shirts4mike.com/', goes to t-shirts catalogue page, finds and returns
//t-shirt info for each t-shirt in catalogue.
osmosis
	.get('http://shirts4mike.com/')
	.find('li.shirts > a')
	.follow('@href')
	.find('div.shirts > div.wrapper > ul > li > a')
	.follow('@href')
	.set({
	    'price':        '.price',
	    'description':  'div.shirt-details > h1',
			'imageUrl':       'img@src'
	})
	.data(function(tShirtInfo) {
		 tempArray = [];
		 tempArray.push(tShirtInfo.price);
		 tempArray.push(tShirtInfo.description.replace(/\$\d+ /, ''));
		 tempArray.push(tShirtInfo.imageUrl);
	})
	.then(function(window) {
		let url = window.location.href;
		tempArray.push(url);
		tempArray.push(getTime());
		csvData.push(tempArray);
	})
	.done(function() {
		if(!fs.existsSync(directory + '/' + getDate() + '.csv'))
			createCSV();
		else {
			fs.unlinkSync(directory + '/' + getDate() + '.csv');
			createCSV();
		}
	})
	// .log(console.log)
	// .error(console.log)
	// .debug(console.log)

//Creating CSV file through use of csv-writer package and csvData array.
function createCSV() {
	const csvWriter = createCsvWriter({
	    header: ['PRICE', 'TITLE', 'IMAGE URL', 'URL', 'TIME'],
	    path: directory + '/' + getDate() + '.csv'
	});

	csvWriter.writeRecords(csvData)       // returns a promise
	    .then(() => {
	        console.log('...CSV File Written');
	    });
}

function getDate() {
	let date = new Date();
	let year = date.getFullYear();
	let month = date.getMonth();
	let day = date.getDate();
	return year + '-' + month + '-' + day;
}

function getTime() {
	let date = new Date();
	let dateArray = date.toString().split(' ');
	return dateArray[4];
}
