var fs = require('fs');

function readFile (fileName) {
  return new Promise( (resolve, reject) => {
    fs.readFile(fileName, (error, data) => {
      if (error) reject(error);
      resolve(data);
    });
  });
};

var asyncReadFile = async function () {
  var f1 = await readFile('./data/homePage/crawLog-1520586781801.json');  // 指定文件读来试试，记得读取回来的是Buufer格式需要转成字符串
  console.log(f1.toString());
};

asyncReadFile()