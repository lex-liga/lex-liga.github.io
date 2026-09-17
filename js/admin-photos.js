/* Lex Liga — compress images before Supabase gallery upload */
(function () {
  var BUCKET = 'gallery';
  var MAX_EDGE = 1600;
  var JPEG_Q = 0.78;

  function loadImageFromFile(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        if (typeof createImageBitmap === 'function') {
          createImageBitmap(file).then(resolve).catch(function () {
            reject(new Error('Could not read image'));
          });
        } else {
          reject(new Error('Could not read image'));
        }
      };
      img.src = url;
    });
  }

  function canvasToJpegBlob(canvas, quality) {
    return new Promise(function (resolve, reject) {
      if (canvas.toBlob) {
        canvas.toBlob(
          function (blob) {
            if (!blob) reject(new Error('Compress failed'));
            else resolve(blob);
          },
          'image/jpeg',
          quality
        );
      } else {
        try {
          var dataUrl = canvas.toDataURL('image/jpeg', quality);
          var bin = atob(dataUrl.split(',')[1]);
          var u8 = new Uint8Array(bin.length);
          for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
          resolve(new Blob([u8], { type: 'image/jpeg' }));
        } catch (e) {
          reject(e);
        }
      }
    });
  }

  function compressToJpeg(file, quality) {
    quality = quality == null ? JPEG_Q : quality;
    return loadImageFromFile(file).then(function (img) {
      var w = img.width || 0;
      var h = img.height || 0;
      if (!w || !h) throw new Error('Invalid image size');
      var scale = 1;
      var longest = Math.max(w, h);
      if (longest > MAX_EDGE) scale = MAX_EDGE / longest;
      var cw = Math.max(1, Math.round(w * scale));
      var ch = Math.max(1, Math.round(h * scale));
      var canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, cw, ch);
      return canvasToJpegBlob(canvas, quality);
    });
  }

  window.lexCompressAndUploadPhotos = async function () {
    var input = document.getElementById('photoFiles');
    var st = document.getElementById('photoStatus');
    var sb = window.supabaseClient;
    if (!sb || !sb.storage) {
      st.textContent = 'Supabase not ready';
      st.className = 'text-sm text-center text-red-400';
      return;
    }
    var files = input && input.files;
    if (!files || !files.length) {
      st.textContent = 'Choose one or more images first';
      st.className = 'text-sm text-center text-red-400';
      return;
    }

    st.textContent = 'Compressing & uploading ' + files.length + ' file(s)…';
    st.className = 'text-sm text-center text-slate-400';

    var ok = 0;
    var fail = 0;

    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var isImage =
        /^image\//.test(file.type) ||
        /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name || '');
      if (!isImage) {
        fail++;
        continue;
      }

      st.textContent = 'Processing ' + (i + 1) + ' / ' + files.length + '…';

      var blob = null;
      try {
        blob = await compressToJpeg(file, JPEG_Q);
        if (blob.size > 4.5 * 1024 * 1024) {
          blob = await compressToJpeg(file, 0.55);
        }
      } catch (e) {
        console.warn('Compress failed', e);
        if (/^image\/(jpeg|png|webp|gif)$/i.test(file.type) && file.size <= 5 * 1024 * 1024) {
          blob = file;
        } else {
          fail++;
          continue;
        }
      }

      var name =
        Date.now() +
        '-' +
        i +
        '-' +
        Math.random().toString(36).slice(2, 8) +
        '.jpg';

      var up = await sb.storage.from(BUCKET).upload(name, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg'
      });

      if (up.error) {
        console.error(up.error);
        fail++;
      } else {
        ok++;
      }
    }

    if (input) input.value = '';
    st.textContent =
      ok +
      ' uploaded' +
      (fail ? ', ' + fail + ' failed' : '') +
      '. Saved as compressed JPEG.';
    st.className = 'text-sm text-center ' + (fail ? 'text-amber-400' : 'text-green-400');

    if (typeof window.loadPhotosAdmin === 'function') {
      window.loadPhotosAdmin();
    }
  };
})();
