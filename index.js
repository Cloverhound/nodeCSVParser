const fs = require('fs')
const path = require('path');
//research into which parts of this package you need to get this complete
const csv = require('fast-csv');
const minimist = require('minimist');

const args = minimist(process.argv.slice(2))
//and also export them so the index.js file can use these values.
let input = args['input']
let output = args['output']



const inputFile = require('path').join(getDir() + input);

//dynamically get the paths of the above files.
function getDir() {
    if (process.pkg) {
        return path.resolve(process.execPath + "/..");
    } else {
        return path.join(require.main ? require.main.path : process.cwd());
    }
}

(async function(){
    const datas = {};

    const parse = csv.parse(
        {
            headers: false,
            ignoreEmpty: true
    });

    const stream = fs.createReadStream(inputFile)
        .pipe(parse)
        .on('data', (d) => {
            let val = d.join(',')
            for(let i = 0; i < val.length; i++){
                if(isNaN(val[i]) === false){
                if(!datas[val[i]]){
                    datas[val[i]] = [];
                    datas[val[i]].push(d);
                } else {
                    datas[val[i]].push(d)
                }
            } 
        }
        }).on('end', () =>{
            Object.keys(datas).forEach(quantity =>{
                const outputFile = require('path').join(getDir() + `${output}/output${quantity}.csv`);
                csv.write(datas[quantity])
                .pipe(fs.createWriteStream(outputFile));
            })
        })
})();
