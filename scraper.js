//Packages and modules.
const createCsvWriter = require('csv-writer').createArrayCsvWriter;
const fs = require('fs');
const osmosis = require("osmosis");

//Variables.
const webAddress = 'http://shirts4mike.com/';
const directory = 'data';
const prices = [];
const descriptions = [];
const imageUrls = [];
const pageUrls = [];
const csvData = [];
let tempArray = [];
let errorCount = 0;

/**
*Checks whether or not 'data' directory exists. If not, said directory is created.
*@requires module: fs.
*/
if(!fs.existsSync(directory)) {
	fs.mkdirSync(directory);
}

/**
*Goes to 'http://shirts4mike.com/', goes to t-shirts catalogue page, finds
t-shirt info for each t-shirt in catalogue, populates object with specified t-shirt
properties and values, uses object to populate array for use in csv file creation,
calls createCSV().
*@requires package: osmosis.
*/
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
	/**
	*@callback populates array with price, description and imageurls from each t-shirt.
	*@param {object} tShirtInfo - object created with t-shirt info through call to .set() above.
	*/
	.data(function(tShirtInfo) {
		 tempArray = [];
		 tempArray.push(tShirtInfo.price);
		 tempArray.push(tShirtInfo.description.replace(/\$\d+ /, ''));
		 tempArray.push(tShirtInfo.imageUrl);
	})
	/**
	*@callback populates array with page urls and timestamp.
	*@param {object} window - window object for each t-shirt page endpoint.
	*/
	.then(function(window) {
		let url = window.location.href;
		tempArray.push(url);
		tempArray.push(getTime());
		csvData.push(tempArray);
	})
	/**
	*@callback Calls createCSV() if data in csvData array, and first deletes existing csv file with same name, if one exists.
	As such, program only saves t-shirt data generated once per day.
	*/
	.done(function() {
		if(!fs.existsSync(directory + '/' + getDate() + '.csv') && csvData.length > 0)
			/**@async function runs asynchronously*/
			createCSV(csvData, directory + '/' + getDate() + '.csv');
		else if(fs.existsSync(directory + '/' + getDate() + '.csv') && csvData.length > 0) {
			fs.unlinkSync(directory + '/' + getDate() + '.csv');
			/**@async function runs asynchronously*/
			createCSV(csvData, directory + '/' + getDate() + '.csv');
		}
	})
	/*
	Optionally console logs a log of completed program operations.
	.log(console.log);
	*/

	/**
	*@callback If error(s), logs error(s) to scraper-error.log file and console logs user-friendly error.
	*@param {string} error - string representing an error.
	*/
	.error(function(error) {
		logError(error, directory + '/scraper-error.log');
		consoleLogError(error);
	});

/**
*@function Creates CSV file.
*@requires package: csv-writer.
*@param {array} array - array of data for csv file.
*@param {string} filePath - the path for the csv file.
*/
function createCSV(array, filePath) {
	try {
		const csvWriter = createCsvWriter({
		    header: ['PRICE', 'TITLE', 'IMAGE URL', 'URL', 'TIME'],
		    path: filePath
		});
		csvWriter.writeRecords(array)
		    .then(() => {
		        console.log('...CSV file written');
		    });
	} catch(error) {
		logError(error, directory + '/scraper-error.log');
		consoleLogError(error.toString());
	}
}

/**
*@function returns current date in year-month-day format.
*/
function getDate() {
	let date = new Date();
	let year = date.getFullYear();
	let month = date.getMonth();
	let day = date.getDate();
	return year + '-' + month + '-' + day;
}

/**
*@function returns current time in hour:minute:second format.
*/
function getTime() {
	let date = new Date();
	let dateArray = date.toString().split(' ');
	return dateArray[4];
}

/**
*@function If no error log file exists, create the file. If file exists, appends any errors to bottom of file.
*@param {string} errorMessage - a string representing an error.
*@param {string} path - the path for the error log file.
*/
function logError(errorMessage, path) {
		let timeStamp = Date();
		try {
		  fs.appendFileSync(path, '[' + timeStamp + '] <' + errorMessage + '>\n');
		} catch (error) {
	  		console.error(error);
		}
}

/**
*@function logs one of two errors to the console. If there is a problem connecting to the site from which the program is
scraping data, a user-friendly error message will be logged explaining that there was a 404 connection error, and the raw
error will be stored in the error log file. For all other errors, the user is informed that something went wrong and asked
to reference the error log for details.
*@param {string} err - a string representing an error.
*/
function consoleLogError(err) {
	if(err.includes('(get)')) {
		console.log('There was a 404 error. Unable to connect to ' + webAddress);
	} else {
		errorCount++;
		if(errorCount < 2)
			console.log('Whoooops! Something went wrong. Please check the "scraper-error.log" file.');
	}
}
