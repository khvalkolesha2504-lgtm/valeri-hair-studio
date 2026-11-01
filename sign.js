/* =====================================================================
   VALERI HAIR STUDIO — «Живая вывеска»
   Объёмная золотая монограмма на WebGL без сторонних библиотек (≈6 КБ).
   Из SVG-монограммы строятся две картинки: цвет золота и «рельеф» (фаска по краям букв
   и подсветка на стене). Шейдер рисует лицевую сторону с отражениями, боковые стенки
   (толщину букв видно при наклоне) и тёплое свечение за буквами.
   Если WebGL недоступен или устройство слабое — create() вернёт null, и сайт покажет
   обычную плоскую монограмму.
   ===================================================================== */
window.VHSSign = (function () {
  'use strict';

  const PAD = 1.5;     // холст больше монограммы, чтобы поместилось свечение
  const COL = 1024;    // размер картинки цвета
  const FLD = 640;     // размер картинки рельефа

  const VERT = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  const FRAG = `
precision highp float;
varying vec2 v;
uniform sampler2D uCol, uFld;
uniform vec2 uTilt, uPx;
uniform float uOn, uSweep, uDepth, uBevel;

vec3 envMap(vec3 r){
  // тёплая «студия»: тёмный фон, большой софтбокс сверху слева, контровой свет справа
  float key  = pow(max(dot(r, normalize(vec3(-.55,.62,.56))), 0.), 5.) * 1.5;
  float rim  = pow(max(dot(r, normalize(vec3(.78,-.12,.62))), 0.), 9.) * .9;
  float strip= smoothstep(.16, 0., abs(r.y - .30 + .25 * r.x)) * .45;
  return vec3(.13,.09,.06) + vec3(1.,.87,.68) * (key + strip) + vec3(1.,.8,.56) * rim;
}

void main(){
  vec2 o = uTilt * uDepth;                 // сдвиг лицевой стороны относительно стены
  vec2 fp = v - o;
  vec4 c = texture2D(uCol, fp);
  float a = c.a;
  vec3 alb = c.rgb;

  // рельеф лицевой стороны -> нормаль
  float hL = texture2D(uFld, fp - vec2(uPx.x, 0.)).r, hR = texture2D(uFld, fp + vec2(uPx.x, 0.)).r;
  float hD = texture2D(uFld, fp - vec2(0., uPx.y)).r, hU = texture2D(uFld, fp + vec2(0., uPx.y)).r;
  vec3 N = normalize(vec3((hL - hR) * uBevel, (hD - hU) * uBevel, 1.));
  vec3 V = normalize(vec3(-uTilt * .45, 1.));
  vec3 R = reflect(-V, N);
  vec3 env = envMap(R);
  float sw = exp(-pow((fp.x * .9 + fp.y * .45 - uSweep) * 9., 2.));       // проходящий блик
  float fr = pow(1. - clamp(N.z, 0., 1.), 2.);
  float spot = smoothstep(1.05, .05, length(fp - vec2(.32, .78)));          // свет сверху слева по лицевой стороне
  vec3 metal = alb * (.3 + spot * .55 + env * 1.15) + vec3(1., .93, .78) * (sw * (.3 + fr * 1.4) * .75 + fr * .14);
  metal *= mix(.11, 1., uOn);

  // боковые стенки: всё, что между стеной (k=0) и лицевой стороной (k=1)
  float sa = 0., sk = 0.;
  for (int i = 0; i < 8; i++) {
    float k = float(i) / 8.;
    float s = texture2D(uCol, v - o * k).a;
    sk = mix(sk, k, step(sa, s) * step(.5, s));
    sa = max(sa, s);
  }
  vec3 sideAlb = texture2D(uCol, v - o * sk).rgb;
  vec3 side = sideAlb * (.16 + .42 * sk) * mix(.06, 1., uOn);

  // подсветка на стене за буквами (свет из-за вывески)
  float g = texture2D(uFld, v).g;
  vec3 glow = (vec3(1., .74, .42) * pow(g, 4.) * .32 + vec3(1., .66, .34) * pow(g, .9) * .2) * uOn
            * smoothstep(.5, .3, length(v - .5));                               // мягко гаснет к краю холста

  vec3 col = glow;
  float al = 0.;
  col = mix(col, side, sa); al = mix(al, 1., sa);
  col = mix(col, metal, a);  al = mix(al, 1., a);
  gl_FragColor = vec4(col, al);
}`;

  /* точное расстояние до ближайшей точки (Felzenszwalb & Huttenlocher), по строкам и столбцам */
  function edt(grid, w, h) {
    const INF = 1e20, n = Math.max(w, h);
    const f = new Float64Array(n), d = new Float64Array(n), z = new Float64Array(n + 1), vv = new Int32Array(n);
    function pass(len) {
      let k = 0; vv[0] = 0; z[0] = -INF; z[1] = INF;
      for (let q = 1; q < len; q++) {
        let s = ((f[q] + q * q) - (f[vv[k]] + vv[k] * vv[k])) / (2 * q - 2 * vv[k]);
        while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[vv[k]] + vv[k] * vv[k])) / (2 * q - 2 * vv[k]); }
        k++; vv[k] = q; z[k] = s; z[k + 1] = INF;
      }
      k = 0;
      for (let q = 0; q < len; q++) { while (z[k + 1] < q) k++; const r = q - vv[k]; d[q] = r * r + f[vv[k]]; }
    }
    for (let x = 0; x < w; x++) { for (let y = 0; y < h; y++) f[y] = grid[y * w + x]; pass(h); for (let y = 0; y < h; y++) grid[y * w + x] = d[y]; }
    for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) f[x] = grid[y * w + x]; pass(w); for (let x = 0; x < w; x++) grid[y * w + x] = Math.sqrt(d[x]); }
    return grid;
  }

  /* рельеф: расстояние от края буквы внутрь (скруглённая фаска) и наружу (свечение на стене) */
  function reliefSync(m, F) {
    const N = F * F, inside = new Float64Array(N), outside = new Float64Array(N);
    for (let i = 0; i < N; i++) { const on = m[i * 4 + 3] > 127; inside[i] = on ? 1e20 : 0; outside[i] = on ? 0 : 1e20; }
    edt(inside, F, F); edt(outside, F, F);
    const out = new Uint8Array(N * 4), B = F * 0.0125, G = F * 0.07;
    for (let i = 0; i < N; i++) {
      const t = Math.min(inside[i] / B, 1);
      out[i * 4] = Math.round(255 * Math.sqrt(1 - (1 - t) * (1 - t)));
      out[i * 4 + 1] = Math.round(255 * (outside[i] > 0 ? Math.exp(-outside[i] / G) : 1));
      out[i * 4 + 3] = 255;
    }
    return out;
  }
  function relief(alpha) {
    return new Promise((res) => {
      let w = null;
      try {
        const code = edt.toString() + '\n' + reliefSync.toString() + '\nonmessage=function(e){var o=reliefSync(e.data.m,e.data.f);postMessage(o,[o.buffer]);};';
        const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
        w = new Worker(url); URL.revokeObjectURL(url);
      } catch (e) { w = null; }
      if (!w) return res(reliefSync(alpha, FLD));
      w.onmessage = (e) => { res(e.data); w.terminate(); };
      w.onerror = () => { w.terminate(); res(reliefSync(alpha, FLD)); };
      w.postMessage({ m: alpha, f: FLD });
    });
  }

  function loadSvg(svg) {
    const clone = svg.cloneNode(true);
    clone.querySelectorAll('[clip-path],[mask]').forEach(el => { el.removeAttribute('clip-path'); el.removeAttribute('mask'); });
    clone.querySelectorAll('clipPath,mask').forEach(el => el.remove());
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', 1000); clone.setAttribute('height', 1000);
    clone.removeAttribute('style'); clone.removeAttribute('class');
    const vb = (clone.getAttribute('viewBox') || '0 0 1 1').split(/[\s,]+/).map(Number);
    const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
    return new Promise((res, rej) => { const img = new Image(); img.onload = () => res({ img, ar: vb[3] / vb[2] }); img.onerror = rej; img.src = src; });
  }

  function draw(img, ar, size) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const x = c.getContext('2d');
    const w = size / PAD, hh = w * ar;
    x.drawImage(img, (size - w) / 2, (size - hh) / 2, w, hh);
    return c;
  }

  function create(svg) {
    const lowEnd = (navigator.hardwareConcurrency || 4) <= 2 || (navigator.deviceMemory && navigator.deviceMemory < 2);
    if (lowEnd) return null;
    const canvas = document.createElement('canvas');
    let gl;
    try {
      gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, failIfMajorPerformanceCaveat: true, powerPreference: 'low-power' });
    } catch (e) { gl = null; }
    if (!gl) return null;

    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const prog = gl.createProgram();
    try {
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
    } catch (e) { return null; }
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {}; ['uCol', 'uFld', 'uTilt', 'uPx', 'uOn', 'uSweep', 'uDepth', 'uBevel'].forEach(n => { U[n] = gl.getUniformLocation(prog, n); });
    gl.uniform1i(U.uCol, 0); gl.uniform1i(U.uFld, 1);
    gl.uniform2f(U.uPx, 1 / FLD, 1 / FLD);
    gl.uniform1f(U.uDepth, 0.014);
    gl.uniform1f(U.uBevel, 3.2);
    gl.clearColor(0, 0, 0, 0);

    function tex(unit, source, w, h) {
      const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      if (w) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, source);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    const state = { on: 0, sweep: -1 };
    const tilt = { x: 0, y: 0, tx: 0, ty: 0, gyro: false };
    let ok = false, running = false, raf = 0, size = 0, t0 = performance.now();

    const ready = loadSvg(svg).then(({ img, ar }) => {
      tex(0, draw(img, ar, COL));
      // рельеф считается в фоновом потоке, чтобы не подвешивать страницу во время вступления
      const alpha = draw(img, ar, FLD).getContext('2d').getImageData(0, 0, FLD, FLD).data;
      return relief(alpha);
    }).then((out) => { tex(1, out, FLD, FLD); ok = true; });

    // наклон: мышь на компьютере, датчик наклона на Android, касание пальцем на телефоне
    const onMove = (e) => { if (tilt.gyro) return; tilt.tx = (e.clientX / innerWidth - 0.5) * 2; tilt.ty = (e.clientY / innerHeight - 0.5) * 2; };
    const onTouch = (e) => { const t = e.touches && e.touches[0]; if (t && !tilt.gyro) { tilt.tx = (t.clientX / innerWidth - 0.5) * 2; tilt.ty = (t.clientY / innerHeight - 0.5) * 2; } };
    const onOrient = (e) => {
      if (e.gamma == null || e.beta == null) return;
      tilt.gyro = true;
      tilt.tx = Math.max(-1, Math.min(1, e.gamma / 25));
      tilt.ty = Math.max(-1, Math.min(1, (e.beta - 45) / 25));
    };
    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('touchmove', onTouch, { passive: true });
    addEventListener('deviceorientation', onOrient, { passive: true });

    function frame(now) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      render(now);
    }
    function render(now) {
      if (!ok) return;
      const t = (now - t0) / 1000;
      // лёгкое «дыхание» вывески, даже если человек ничего не двигает
      const ix = tilt.tx + Math.sin(t * 0.5) * 0.22, iy = tilt.ty + Math.cos(t * 0.37) * 0.16;
      tilt.x += (ix - tilt.x) * 0.06; tilt.y += (iy - tilt.y) * 0.06;
      canvas.style.transform = `perspective(900px) rotateX(${(-tilt.y * 7).toFixed(2)}deg) rotateY(${(tilt.x * 9).toFixed(2)}deg)`;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(U.uTilt, tilt.x, -tilt.y);
      gl.uniform1f(U.uOn, state.on);
      gl.uniform1f(U.uSweep, state.sweep);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    return {
      canvas, state, ready,
      resize(css) {
        const dpr = Math.min(devicePixelRatio || 1, innerWidth < 768 ? 2 : 1.75);
        const px = Math.round(css * dpr);
        if (px === size) return;
        size = px; canvas.width = canvas.height = px;
        canvas.style.width = canvas.style.height = css + 'px';
      },
      start() { if (running) return; running = true; raf = requestAnimationFrame(frame); },
      stop() { running = false; cancelAnimationFrame(raf); },
      render(now) { render(now == null ? performance.now() : now); },
      setTilt(x, y) { tilt.tx = x; tilt.ty = y; tilt.x = x; tilt.y = y; },
      setTarget(x, y) { tilt.tx = x; tilt.ty = y; },
      destroy() {
        this.stop();
        removeEventListener('pointermove', onMove); removeEventListener('touchmove', onTouch); removeEventListener('deviceorientation', onOrient);
        const ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext();
        canvas.remove();
      }
    };
  }

  return { create };
})();
