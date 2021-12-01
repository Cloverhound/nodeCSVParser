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
            let arrayOfKeys = ["CD0", "CD1", "CD2", "CD3", "CD4", "CD5","CD6","CD7", "DD1", "DD2", "DD3", "DD4", "DD5", "DD6", "DD7"]
            // This .join is giving me each row
            // let val = d.join(',')
            // console.log('this is our value!! ',d)
            let val;
            for(let i = 0; i < d.length; i++){
                // Checking if this is a number instead compare it against the array
                val = d[i]
            //  console.log('this is our d[i]', val.substring(0,3))
            // console.log('here is if we found the val!',arrayOfKeys.indexOf(d[i]) !== -1 )
                if(arrayOfKeys.indexOf(val.substring(0,3)) !== -1){
                    // console.log('found a number we care about!')
                if(!datas[d[i]]){
                    datas[d[i]] = [];
                    datas[d[i]].push(d);
                } else {
                    datas[d[i]].push(d)
                }
            } 
        }
        }).on('end', () =>{
            Object.keys(datas).forEach(quantity =>{
                // console.log('this is quantity', quantity)
                const outputFile = require('path').join(getDir() + `${output}/output${quantity.trim()}.csv`);
                console.log('this is our file name', outputFile)
                csv.write(datas[quantity])
                .pipe(fs.createWriteStream(outputFile));
            })
        })
})();
