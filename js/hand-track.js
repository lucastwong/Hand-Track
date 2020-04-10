const webcamElement = document.getElementById('webcam');
const webcam = new Webcam(webcamElement, 'environment');
const canvasElement = document.getElementById('canvas');
let model = null;
let cameraFrame = null;
let handCount = 0;
let fireElements = [];

$( document ).ready(function() {
    for(let j=0; j<50; j++){
        $("<div class='particle'></div>").appendTo($(".fire"));
    }
});

$("#webcam-switch").change(function () {
    if(this.checked){
        $('.md-modal').addClass('md-show');
        webcam.start()
            .then(res => {
                cameraStarted();
                loadModel().then(res => {
                    cameraFrame = startDetection();
                })
            })
            .catch(err => {
                $("#errorMsg").removeClass("d-none")
            });
    }
    else {        
        $("#errorMsg").addClass("d-none");
        cameraStopped();
        webcam.stop();
        if(cameraFrame!= null){
            cancelAnimationFrame(cameraFrame);
        }
    }        
});


async function loadModel() {
    $(".loading").removeClass('d-none');
    return new Promise((resolve, reject) => {
        const modelParams = {
            flipHorizontal: true,   // flip e.g for video  
            maxNumBoxes: 20,        // maximum number of boxes to detect
            iouThreshold: 0.5,      // ioU threshold for non-max suppression
            scoreThreshold: 0.6,    // confidence threshold for predictions.
        }

        handTrack.load(modelParams).then(mdl => {
            model = mdl;
            $(".loading").addClass('d-none');
            resolve();
        }).catch(err => {
            $("#errorMsg").html('Fail to load hand track model.');
            $("#errorMsg").removeClass("d-none");
            reject(error);
        });
    });
}

function startDetection() {
    model.detect(webcamElement).then(predictions => {
        //console.log("Predictions: ", predictions);
        showFire(predictions);
        cameraFrame = requestAnimFrame(startDetection);
    });
}

function showFire(predictions){
    if(handCount != predictions.length){
        $("#canvas").empty();
        fireElements = [];
    }   
    handCount = predictions.length;

    for (let i = 0; i < predictions.length; i++) {
        //bbox: [x, y, width, height]
        var hand_center_point = getHandCenterPoint(predictions[i].bbox);
        if (fireElements.length > i) { 
            fireElement = fireElements[i];
        }else{
            fireElement = createFire(i);
            fireElements.push(fireElement);
            fireElement.appendTo($("#canvas"));
        }
        fireElement.css({top: hand_center_point[0] -120, left: hand_center_point[1], position:'absolute'});
    }
}

function getHandCenterPoint(bbox){
    var ratio = canvasElement.clientHeight/webcamElement.height;
    var x = bbox[0];
    var y = bbox[1];
    var w = bbox[2];
    var h = bbox[3];
    var hand_center_left = x*ratio + (w*ratio/2);
    var hand_center_top = y*ratio + (h*ratio/2);
    return [hand_center_top, hand_center_left];
}

function createFire(handNum){
    var fireElement = "<div class='fire_in_hand' id='fire_"+handNum+"'>";
    for(let j=0; j<50; j++){
        fireElement = fireElement + "<div class='particle'></div>";
    }
    fireElement = fireElement + "</div>";
    return $(fireElement);
}

function cameraStarted(){
    $("#errorMsg").addClass("d-none");
    $("#webcam-caption").html("on");
    $("#webcam-control").removeClass("webcam-off");
    $("#webcam-control").addClass("webcam-on");
    $(".webcam-container").removeClass("d-none");
    var ratioWebCamWidth = webcamElement.scrollHeight * (webcamElement.width/webcamElement.height);
    var webCamFullWidth = webcamElement.scrollWidth;
    $("#canvas").css({width: ((ratioWebCamWidth < webCamFullWidth) ? ratioWebCamWidth : webCamFullWidth)});
    $("#wpfront-scroll-top-container").addClass("d-none");
    //window.scrollTo(0, 0); 
    $('body').css('overflow-y','hidden');
}

function cameraStopped(){
    $("#wpfront-scroll-top-container").removeClass("d-none");
    $("#webcam-control").removeClass("webcam-on");
    $("#webcam-control").addClass("webcam-off");
    $("#cameraFlip").addClass('d-none');
    $(".webcam-container").addClass("d-none");
    $("#webcam-caption").html("Click to Start Camera");
    //$('body').css('overflow-y','scroll');
    $([document.documentElement, document.body]).animate({
        scrollTop: ($("#hand-app").offset().top - 80)
    }, 1000);
    $('.md-modal').removeClass('md-show');
}

window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function( callback ){
            window.setTimeout(callback, 1000 / 60);
        };
})();

window.cancelAnimationFrame = (function(){
    return  window.cancelAnimationFrame || window.mozCancelAnimationFrame;
})();