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
            // let val = d.join(',')
            let arrOfKeys = ["CD1", "CD2", "CD3", "CD4", "CD5", "CD6","CD7", "DD1", "DD2", "DD3", "DD4", "DD5", "DD6", "DD7"]
            let val;
            for(let i = 0; i < d.length; i++){
                val = d[i]
                console.log(val.substring(0,3))
                if(arrOfKeys.indexOf(val.substring(0,3)) > 0){
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
                const outputFile = require('path').join(getDir() + `${output}/output${quantity.trim()}.csv`);
                csv.write(datas[quantity])
                .pipe(fs.createWriteStream(outputFile));
            })
        })
})();
