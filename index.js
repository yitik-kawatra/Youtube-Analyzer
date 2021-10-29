const puppeteer=require('puppeteer');

const pdf=require('pdfkit');
const fs=require('fs');
let ctab;
let link='https://www.youtube.com/playlist?list=PLzkuLC6Yvumv_Rd5apfPRWEcjf9b1JRnq';
(async function(){
    try{
        let browserOpen=puppeteer.launch({
            headless:false,
            defaultViewport:null,
            args:['--start-maximized']
        });

        let browserInstance=browserOpen;
        let allTabsArr=await (await browserInstance).pages();
        ctab=allTabsArr[0];
       await ctab.goto(link);
       await ctab.waitForSelector('h1#title');
       let name=await ctab.evaluate(function(select){return document.querySelector(select).innerText},'h1#title');
       console.log(name);
       let allData=await ctab.evaluate(getData,'#stats .style-scope.ytd-playlist-sidebar-primary-info-renderer');
        console.log(allData.noOfVideos,allData.noOfViews);

        let totalVideos=allData.noOfVideos.split(" ")[0];

        let currentVideos=await getCVideosLength();
        console.log(currentVideos);

        while(totalVideos-currentVideos>=20){
             await scrollToBottom();
             currentVideos=await getCVideosLength();
        }
        
        let finalList=await getStats();
    
        let pdfDoc=new pdf;
        pdfDoc.pipe(fs.createWriteStream("play.pdf"));
        pdfDoc.text(JSON.stringify(finalList));
        pdfDoc.end();
        
    }
    catch(error){

    }

})()

function getData(selector){
    let allElems=document.querySelectorAll(selector);
    let noOfVideos=allElems[0].innerText;
    let noOfViews=allElems[1].innerText;
    
    return {
        noOfVideos,
        noOfViews
    }
}

async function getCVideosLength(){
 let length=await ctab.evaluate(getLength,'#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer');
  return length;
}


function getLength(durationSelect){
    let durationElem=document.querySelectorAll(durationSelect);
    return durationElem.length;
}

async function scrollToBottom(){
    await ctab.evaluate(goToBottom);
    function goToBottom(){
        window.scrollBy(0,window.innerHeight);
    }
}

async function getStats(){
    let list=ctab.evaluate(getNameAndDuration,'#video-title','#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer');
    return list;
}

function getNameAndDuration(videoSelector,durationSelector){
    let videoElem=document.querySelectorAll(videoSelector);
    let durationElem=document.querySelectorAll(durationSelector);
    
    let currentList=[];

    for(let i=0;i<durationElem.length;i++){
        let videoTitle=videoElem[i].innerText;
        let duration=durationElem[i].innerText;
        currentList.push({videoTitle,duration});
    }

    return currentList;

}