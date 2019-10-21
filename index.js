var cluster = require('cluster');
const os = require('os')
const cpuCount = os.cpus().length

var workers = [];

if (cluster.isMaster) {
  var imagesCount = 0 ;
  console.log('Master ' + process.pid + ' has started.');

  // Fork workers.
  for (var i = 0; i < cpuCount; i++) {
    workers.push(cluster.fork());

    // Receive messages from this worker and handle them in the master process. And register callback to it.
    workers[i].on('message', function(msg) {
      handleScaledImage(msg);
    //   console.log('Master ' + process.pid + ' received the parsed image from worker ' + this.process.pid + '.');
    });
  }

  // Be notified when worker processes die.
  cluster.on('death', function(worker) {
    console.log('Worker ' + worker.pid + ' died.');
  });

    var fs = require('fs');
    var image = fs.readFileSync("./test.jpg");

    var timeToBreak=false;
    var sendQueSize=0;

    var inter = setInterval(() => {
        if(sendQueSize<cpuCount*2){
            workers[Math.floor(Math.random() * cpuCount) + 0 ].send({msgFromMaster: image});
            sendQueSize++;
        }
    }, 1);

    setTimeout(()=>{
       clearInterval(inter)
       console.log("Number of images created : " , imagesCount)
       console.log("Capable of holding FPS : " , imagesCount/10)

    },10000)

    function handleScaledImage(image){
        // console.log(new Buffer(image.msgFromWorker))
        imagesCount++;
        sendQueSize--;
    }
}

if (cluster.isWorker) {
    var sharp = require('sharp');
    console.log('Worker ' + process.pid + ' has started.');
    process.on('message', function(msg) {
    //   console.log('Worker ' + process.pid + ' received message from master.');
      sharp(new Buffer(msg.msgFromMaster)).resize(1920/4, 1080/4).toBuffer((err, buffer,info) => { 
        process.send({msgFromWorker: buffer}); 
        });
    });
  }