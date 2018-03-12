const createCsvWriter = require('csv-writer').createArrayCsvWriter;
const fs = require('fs');
const osmosis = require("osmosis");

const webAddress = 'http://shirts4mike.com/';
const directory = 'data';
const prices = [];
const descriptions = [];
const imageUrls = [];
const pageUrls = [];
const csvData = [];
let tempArray = [];
let errorCount = 0;

//Checks whether or not 'data' directory exists. If not, said directory is created.
if(!fs.existsSync(directory)) {
	fs.mkdirSync(directory);
}

//Goes to 'http://shirts4mike.com/', goes to t-shirts catalogue page, finds and returns
//t-shirt info for each t-shirt in catalogue.
osmosis
	.get(webAddress)
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
		if(!fs.existsSync(directory + '/' + getDate() + '.csv') && csvData.length > 0)
			createCSV(csvData, directory + '/' + getDate() + '.csv');
		else if(fs.existsSync(directory + '/' + getDate() + '.csv') && csvData.length > 0) {
			fs.unlinkSync(directory + '/' + getDate() + '.csv');
			createCSV(csvData, directory + '/' + getDate() + '.csv');
		}
	})
	// .log(function(logInfo) {
	// 	console.log(logInfo);
	// })
	.error(function(error) {
		let errorCount = 0;
		errorCount++;
		logError(error, directory + '/scraper-error.log');
		consoleLogError(error);
	});

//Creating CSV file through use of csv-writer package and csvData array.
function createCSV(array, filePath) {
	try {
		const csvWriter = createCsvWriter({
		    header: ['PRICE', 'TITLE', 'IMAGE URL', 'URL', 'TIME'],
		    path: filePath
		});
		csvWriter.writeRecords(array)       // returns a promise
		    .then(() => {
		        console.log('...CSV file written');
		    });
	} catch(error) {
		logError(error, directory + '/scraper-error.log');
		consoleLogError(error.toString());
	}
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

function logError(errorMessage, path) {
		let timeStamp = Date();
		try {
		  fs.appendFileSync(path, '[' + timeStamp + '] <' + errorMessage + '>\n');
		} catch (error) {
	  		console.error(error);
		}
}

function consoleLogError(err) {
	if(err.includes('(get)')) {
		console.log('There was a 404 error. Unable to connect to ' + webAddress);
	} else {
		errorCount++;
		if(errorCount < 2)
			console.log('Whoooops! Something went wrong. Please check the "scraper-error.log" file.');
	}
}
