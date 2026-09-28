/* S SALON — portada WebGL con separación RGB, revista y fotos con aberración cromática */
gsap.registerPlugin(ScrollTrigger);
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* ---------- portada WebGL ---------- */
(function coverGL() {
  const cv = $('#coverGL'), img = $('.cover__img');
  const gl = cv.getContext('webgl', { premultipliedAlpha: false });
  if (!gl) return;
  const vs = `attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;uv.y=1.-uv.y;gl_Position=vec4(p,0.,1.);}`;
  const fs = `precision mediump float;uniform sampler2D t;uniform vec2 res,img,m;uniform float s,time;varying vec2 uv;
  vec2 cover(vec2 q){float r=res.x/res.y,ir=img.x/img.y;vec2 sc=r>ir?vec2(1.,ir/r):vec2(r/ir,1.);vec2 c=(q-.5)*sc+.5;c.y+=(.2-.5)*(1.-sc.y);return c;}
  void main(){float d=distance(uv*vec2(res.x/res.y,1.),m*vec2(res.x/res.y,1.));float w=s*smoothstep(.55,0.,d);
  vec2 dir=normalize(uv-m+1e-4);vec2 off=dir*w*.05+vec2(sin(uv.y*26.+time*2.)*.003*(s+.15),0.);
  float r=texture2D(t,cover(uv+off*1.8)).r;float g=texture2D(t,cover(uv+off)).g;float b=texture2D(t,cover(uv+off*.3)).b;
  gl_FragColor=vec4(r,g,b,1.);}`;
  const sh = (type, src) => { const x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); return x; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(pr, n);
  const tex = gl.createTexture();
  const state = { mx: .5, my: .5, s: 0, target: 0, lx: .5, ly: .5 };
  function start() {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.uniform2f(U('img'), img.naturalWidth, img.naturalHeight);
    $('.cover').classList.add('has-gl');
    size(); gsap.ticker.add(draw);
  }
  function size() { const d = Math.min(2, devicePixelRatio || 1); cv.width = cv.clientWidth * d; cv.height = cv.clientHeight * d; gl.viewport(0, 0, cv.width, cv.height); gl.uniform2f(U('res'), cv.width, cv.height); }
  addEventListener('resize', size);
  $('.cover').addEventListener('pointermove', e => {
    const r = cv.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    state.target = Math.min(1, state.target + Math.hypot(x - state.lx, y - state.ly) * 6);
    state.lx = x; state.ly = y;
  });
  let vis = true;
  new IntersectionObserver(([e]) => { vis = e.isIntersecting; }).observe(cv);
  function draw(t) {
    if (!vis) return;
    state.mx += (state.lx - state.mx) * .12; state.my += (state.ly - state.my) * .12;
    state.s += (state.target - state.s) * .1; state.target *= .94;
    gl.uniform2f(U('m'), state.mx, state.my); gl.uniform1f(U('s'), state.s + .12 + Math.sin(t * 1.3) * .05); gl.uniform1f(U('time'), t);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  if (img.complete && img.naturalWidth) start(); else img.addEventListener('load', start);
})();

/* ---------- entrada de portada ---------- */
const mast = $('.mast');
mast.innerHTML = [...mast.textContent].map(c => `<span style="display:inline-block">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
gsap.timeline({ delay: .2 })
  .from('.cover', { yPercent: 6, rotation: -1.5, scale: .94, duration: 1.2, ease: 'expo.out' })
  .from('.mast span', { yPercent: 110, opacity: 0, duration: 1, ease: 'expo.out', stagger: .05 }, .2)
  .from('.cover__issue', { opacity: 0, x: -20, duration: .6 }, .7)
  .from('.lines li', { x: -40, opacity: 0, duration: .8, ease: 'expo.out', stagger: .1 }, .8)
  .from('.barcode', { y: 30, opacity: 0, duration: .6 }, 1.1)
  .fromTo('.barcode__bars', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: .7, ease: 'power2.inOut' }, 1.3);

/* ---------- nav tras la portada ---------- */
ScrollTrigger.create({ trigger: '.cover', start: 'bottom 80px', onEnter: () => $('.nav').classList.add('is-on'), onLeaveBack: () => $('.nav').classList.remove('is-on') });

/* ---------- aberración cromática en las fotos ---------- */
(function rgb() {
  document.body.insertAdjacentHTML('beforeend', `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="onlyR"><feColorMatrix values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"/></filter><filter id="onlyB"><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0"/></filter></svg>`);
  $$('.fx').forEach(f => {
    const src = f.querySelector('img').getAttribute('src');
    f.insertAdjacentHTML('beforeend', `<div class="ch ch--r" style="filter:url(#onlyR)"><img src="${src}" alt=""></div><div class="ch ch--b" style="filter:url(#onlyB)"><img src="${src}" alt=""></div>`);
  });
})();

/* ---------- revista: apariciones con carácter ---------- */
gsap.from('.toc__list li', { x: -60, opacity: 0, duration: 1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.toc', start: 'top 75%' } });
gsap.from('.spread__head h2', { yPercent: 30, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.spread', start: 'top 75%' } });
$$('.gallery .fx').forEach((f, i) => gsap.from(f, { clipPath: 'inset(100% 0 0 0)', duration: 1.4, ease: 'expo.inOut', delay: i * .08, scrollTrigger: { trigger: '.gallery', start: 'top 80%' } }));
$$('.feature').forEach(f => {
  gsap.from(f.querySelector('.feature__img'), { clipPath: 'inset(0 0 0 100%)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: f, start: 'top 75%' } });
  gsap.from(f.querySelectorAll('.feature__txt > *'), { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: f, start: 'top 70%' } });
});
$$('.trio__grid article, .letters blockquote, .back__grid > div').forEach(n => gsap.from(n, { y: 40, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: n, start: 'top 90%' } }));
gsap.fromTo('.back__mast', { xPercent: -10 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: '.back', start: 'top bottom', end: 'top 30%', scrub: true } });
