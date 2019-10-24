import QRReader from './vendor/qrscan.js';
import { snackbar } from './snackbar.js';
import styles from '../css/styles.css';
import isURL from 'is-url';

//If service worker is installed, show offline usage notification
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(reg => {
        console.log('SW registered: ', reg);
        if (!localStorage.getItem('offline')) {
          localStorage.setItem('offline', true);
          snackbar.show('App is ready for offline usage.', 5000);
        }
      })
      .catch(regError => {
        console.log('SW registration failed: ', regError);
      });
  });
}

window.addEventListener('DOMContentLoaded', () => {
  //To check the device and add iOS support
  window.iOS = ['iPad', 'iPhone', 'iPod'].indexOf(navigator.platform) >= 0;
  window.isMediaStreamAPISupported = navigator && navigator.mediaDevices && 'enumerateDevices' in navigator.mediaDevices;
  window.noCameraPermission = false;

  var copiedText = null;
  var frame = null;
  var selectPhotoBtn = document.querySelector('.app__select-photos');
  var browserOpenBtnElement = document.querySelector('.app__browser-open');
  var copyClipboardBtnElement = document.querySelector('.app__copy-clipboard');
  var reloadScanBtnElement = document.querySelector('.app__scan-reload');
  var scanningEle = document.querySelector('.custom-scanner');
  var textBoxEle = document.querySelector('#result');
  var result_qrcode = document.querySelector('.result_qrcode');
  var helpTextEle = document.querySelector('.app__help-text');
  var infoSvg = document.querySelector('.app__header-icon svg');
  var videoElement = document.querySelector('video');
  window.appOverlay = document.querySelector('.app__overlay');

  //Initializing qr scanner
  window.addEventListener('load', event => {
    QRReader.init(); //To initialize QR Scanner
    // Set camera overlay size
    setTimeout(() => {
      if (window.isMediaStreamAPISupported) {
        scan();
      }
    }, 1000);
    // To support other browsers who dont have mediaStreamAPI
    selectFromPhoto();
  });

  function createFrame() {
    frame = document.createElement('img');
    frame.src = '';
    frame.id = 'img-codabar';
  }

  browserOpenBtnElement.addEventListener('click', openInBrowser, false);

  //To open result in browser
  function openInBrowser() {
    window.open(copiedText, '_blank', 'toolbar=0,location=0,menubar=0');
    copiedText = null;
  }

  //Scan
  function scan(forSelectedPhotos = false) {
    if (window.isMediaStreamAPISupported && !window.noCameraPermission) {
      scanningEle.style.display = 'block';
    }

    if (forSelectedPhotos) {
      scanningEle.style.display = 'block';
    }

    setTimeout(function() {
      QRReader.scan(result => {
        copiedText = result;
        textBoxEle.value = result;
        textBoxEle.select();
        scanningEle.style.display = 'none';
        copyClipboardBtnElement.style.display = 'inline-block';
        reloadScanBtnElement.style.display = 'block';
        result_qrcode.removeAttribute('disabled');
        snackbar();
        localStorage.setItem('seal_number', result);
        if (isURL(result)) {
          browserOpenBtnElement.style.display = 'inline-block';
        } else {
          browserOpenBtnElement.style.display = 'none';
        }
        const frame = document.querySelector('#img-codabar');
        if (forSelectedPhotos && frame) frame.remove();
      }, forSelectedPhotos);
    }, 1000);
  }

  function selectFromPhoto() {
    //Creating the camera element
    var camera = document.createElement('input');
    camera.setAttribute('type', 'file');
    camera.setAttribute('capture', 'camera');
    camera.id = 'camera';
    window.appOverlay.style.borderStyle = '';
    selectPhotoBtn.style.display = 'block';
    createFrame();

    //Add the camera and img element to DOM
    var pageContentElement = document.querySelector('.app__overlay-frame');
    pageContentElement.appendChild(camera);
    pageContentElement.appendChild(frame);

    // //Click of camera fab icon
    selectPhotoBtn.addEventListener('click', () => {
      scanningEle.style.display = 'none';
      document.querySelector('#camera').click();
    });

    //On camera change
    camera.addEventListener('change', event => {
      if (event.target && event.target.files.length > 0) {
        frame.className = 'app__overlay';
        frame.src = URL.createObjectURL(event.target.files[0]);
        if (!window.noCameraPermission) scanningEle.style.display = 'block';
        window.appOverlay.style.borderColor = 'rgb(62, 78, 184)';
        scan(true);
      }
    });
  }

  function snackbar() {
    // Get the snackbar DIV
    var x = document.getElementById('snackbar');

    // Add the "show" class to DIV
    x.className = 'show';

    // After 3 seconds, remove the show class from DIV
    setTimeout(function() {
      x.className = x.className.replace('show', '');
    }, 3000);
  }

  //copy data clipboard
  copyClipboardBtnElement.addEventListener('click', event => {
    /* Get the text field */
    var copyText = document.getElementById('result');
    console.log(copyText);
    /* Select the text field */
    copyText.select();

    /* Copy the text inside the text field */
    document.execCommand('copy');
  });

  //Click reload scan
  reloadScanBtnElement.addEventListener('click', () => {
    document.location.reload();
  });
});
