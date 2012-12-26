function fileSelected()
{
    var file = document.getElementById('fileToUpload').files[0];
    var fileSize = 0;
    if (file.size > 1024 * 1024)
        fileSize = (Math.round(file.size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
    else
        fileSize = (Math.round(file.size * 100 / 1024) / 100).toString() + 'KB';
    document.getElementById('fileInfo').style.display = 'block';
    document.getElementById('fileName').innerHTML = 'Name: ' + file.name;
    document.getElementById('fileSize').innerHTML = 'Size: ' + fileSize;
    document.getElementById('fileType').innerHTML = 'Type: ' + file.type;
}

function getParam(paramName)
{
  keyValStrings = document.URL.split('#')[1].split(';');
  for(var i = 0; i < keyValStrings.length; i++){
    if(keyValStrings[i].split('=')[0] == paramName){
      return keyValStrings[i].split('=')[1];
    }
  }
}

function documentReady(){
  document.getElementById('roomName').setAttribute('value', getParam('room'));
}
