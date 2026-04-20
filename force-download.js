const fs = require('fs');
const https = require('https');
const path = require('path');

const url = 'https://raw.githubusercontent.com/ionic-team/capacitor/main/android/template/gradle/wrapper/gradle-wrapper.jar';
const dest = path.join(__dirname, 'android/gradle/wrapper/gradle-wrapper.jar');

const file = fs.createWriteStream(dest);

https.get(url, function(response) {
  if (response.statusCode === 200) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(() => console.log('Successfully downloaded fresh gradle-wrapper.jar'));
    });
  } else if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
    console.log('Redirected to:', response.headers.location);
    https.get(response.headers.location, function(redirectResponse) {
       redirectResponse.pipe(file);
       file.on('finish', function() {
         file.close(() => console.log('Successfully downloaded from redirect'));
       });
    });
  } else {
      console.log('HTTP Error:', response.statusCode);
  }
}).on('error', function(err) {
  fs.unlink(dest, () => {});
  console.log('Error:', err.message);
});
