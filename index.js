const fs = require('fs');
const path = require('path');
const https = require('https');
const axios = require('axios');
const csv = require('fast-csv');
const chokidar = require('chokidar');
require('dotenv').config();
const config = require('./config.json');

const PATH_TO_OUTPUT_FOLDER = config.outputFolderPath
const folderToMonitor = "/Users/danhuang/Documents/testMonitor";
const folderToStore = "/Users/danhuang/Documents/archivedCSV";

const watcher = chokidar.watch(folderToMonitor, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles/(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  awaitWriteFinish: {
    stabilityThreshold: 2000,
    pollInterval: 100
  },awaitWriteFinish: {
    stabilityThreshold: 2000,
    pollInterval: 100
  }
})
const csvExtension = '.csv'
const log = console.log.bind(console);

watcher
  .on('add', path =>  parseFiles(path.split('/').find(val => val.includes(csvExtension))) )
  .on('change', path => log(`File ${path} has been changed `))
  .on('unlink', () =>  axiosSendXML())

//dynamically get the paths of the above files.
function getDir() {
    if (process.pkg) {
        return path.resolve(process.execPath + "/..");
    } else {
        return path.join(require.main ? require.main.path : process.cwd());
    }
}

async function parseFiles(file){
    const datas = {};

    const parse = csv.parse(
        {
            headers: false,
            ignoreEmpty: true
    });

    try {
      const pathToCSV = path.join(folderToMonitor)
      const stream = fs.createReadStream(`${pathToCSV}/${file}`)
        .pipe(parse)
        .on('data', (d) => {
            let arrayOfKeys = ["CD0", "CD1", "CD2", "CD3", "CD4", "CD5","CD6","CD7", "DD1", "DD2", "DD3", "DD4", "DD5", "DD6", "DD7"];
            let val;
            for(let i = 0; i < d.length; i++){
              // console.log('this is our val!!!', val)
                val = d[i];
                if(arrayOfKeys.indexOf(val.substring(0,3)) !== -1){
                if(!datas[val]){
                    datas[val] = [];
                    datas[val].push(d);
                } else {
                    datas[val].push(d);
                }
            }
        }
        }).on('end', () =>{
            Object.keys(datas).forEach(quantity =>{
                // This is the path to where the separated csvs go
                const dirPath = path.join(PATH_TO_OUTPUT_FOLDER)
                // Our parsed files that we will send to our campaigns 
                const outputFile = `${dirPath}/output${quantity.trim()}.csv`
                // console.log('this is our file name', outputFile)
                csv.write(datas[quantity])
                .pipe(fs.createWriteStream(outputFile));
            })
        })
    } catch (error) {
      console.log(error)
    }
    // File paths to the original CSV we are parsing and where we store the original for records.
  const pathToOriginalCSV = path.join(folderToMonitor)
  const pathToArchivedCSV = path.join(folderToStore)
    fs.rename(`${pathToOriginalCSV}/${file}`, `${pathToArchivedCSV}/${file}`, (err) => {
      if(err) throw err
      console.log(`successfully moved ${file} to ${folderToStore}`)
    })
    
}


async function buildXML() {
    const parse = csv.parse(
                {
                    headers: false,
                    ignoreEmpty: true
            });
   const files = await fs.readdir(require('path').join(getDir() + '/csv'), (err, data) => {
       // This is giving us an object
       if(err) throw err
    //    console.log(typeof data)
    for(let i = 0; i < data.length; i++){
        // console.log('here is our indicidual file', data[i])
        let individualFile = data[i]
        // console.log(typeof individualFile)
    const stream = fs.createReadStream(require('path').join(`${getDir()}/csv/${individualFile}`))
        .pipe(parse)
        .on('data', (d) =>{
            // console.log('this is our data', d) we are just going to use the first item as an account number for now.
    var csvData  = `AccountNumber,FirstName,LastName,Phone01,TimeZoneBias,DstObserved\n${d[0]},${d[3]},${d[4].trim()},${d[8]},${d[9]},${d[10]}`
    var fileContent   = `<fileContent><![CDATA[${csvData}]]></fileContent>`
    var overwriteData = `<overwriteData>${true}</overwriteData>`
    var xmlString     = `<import>${fileContent}${overwriteData}</import>`
        // console.log('this is our data', xmlString)
    return xmlString
        })
        }
   })
  }

  function axiosSendXML() {
    let xml = buildXML()
    const agent = new https.Agent({
      rejectUnauthorized: false
    });
  
    var config = {
      headers: {
        'Content-Type': 'application/xml'
      },
      auth: {
        username: `${process.env.USERNAME}`,
        password: `${process.env.PASSWORD}`
      },
      httpsAgent: agent
    }
  
    axios.post(`${process.env.SERVERIP}${process.env.SERVERADDRESS}${'5011'}/import`,
      xml,
      config,
    ).then(function(response){
      console.log(response)
      //delete the successfully sent files
      const pathToCSV = path.join(PATH_TO_OUTPUT_FOLDER)
    fs.readdir(pathToCSV, (err, files) => {
      if (err) console.log(err);
      for (const file of files) {
          fs.unlink(path.join(pathToCSV, file), err => {
              if (err) console.log(err);
          });
      }
  });
    }).catch(function(error){
      console.log("this is our error!!", error)
    })
  }
