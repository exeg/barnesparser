const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const request = require('requestretry');
//require('request');
const microdata = require('microdata-node');
const cleanMicrodata = require('./lib/cleanMicrodata');
const rp = require('request-promise');



let booksin = [];


function barnesparse(body) {
  let result = true;
  cleanMicrodata(microdata.toJson(body), function (err, cleanData) {
    if (!err && cleanData) {
      const $ = cheerio.load(body);
      if ($("title").text() === 'No Results Page | Barnes & Noble®'){
        console.log('NO BOOK');
        result = false;
        return;
      } else if (Number($('#prodSummary').find('[itemprop="ratingValue"]').text()) < 4) {
        console.log('low Rating');
        result = false;
        return;
      } else if (Number(($('#prodPromo').find('[itemprop="price"]').text()).slice(1)) > 0) {
        console.log('This book is no longer Free');
        result = false;
        return;
      }    
    } else {
      return(err || 'CleanData fail');
    }
  });
  return result;
};

function getData() {
// Make sure we got a filename on the command line.
  if (process.argv.length < 3) {
    console.log('Usage: node ' + process.argv[1] + ' FILENAME');
    process.exit(1);
  }

// Read the file and print its contents.
  const filename = process.argv[2];
  let data = fs.readFileSync(filename, 'utf8');
  return data;
};

async function inputParser (data) {
  let $ = cheerio.load(data, {
    ignoreWhitespace: true,
    decodeEntities: false 
  });

  await $('li').each(function(i, elem) {
    const book = {
      href : $(this).children().attr('href'),
      i : i      
    }
  
    booksin.push(book);
 
  });

  for (let k = 0; k < booksin.length; k++) {
    const hh = await main(booksin[k].href);
    if (hh) {
      booksin[k].del = false;
      continue;
    } else {
     booksin[k].del = true;
    }
  }

  await $('li').each(function(i, elem) {
    if (booksin[i].del === true) {
      $(this).remove();
      return true;
    }

  });

    letk = await $.html();
    fs.writeFile(process.argv[2], letk, function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
});  
  
  
};

async function main (url) {
  let opts = {
    Accept: '*/*',
    uri: url,
    fullResponse: false,
    maxAttempts: 5,
    retryStrategy: request.RetryStrategies.HTTPOrNetworkError,
    headers: {
    'User-Agent': 'runscope/0.1'
      }
     
  };

  return await request(opts)
    .then(async function (body) {
      let result = await barnesparse(body);
        //console.log(result);
        if (result) {
        return true;
        } else {
          return false;
        }
  
})
.catch(function(error) {
  console.log(err);
  process.exit(1);
})
  
};


async function startShow () {
  let data = getData();
  await inputParser(data);  

};


startShow();