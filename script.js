(()=>{
  const enhanceHero=()=>{
    const heroImage=document.querySelector('.hero-media img');
    if(!heroImage)return;
    heroImage.src='assets/hero-main-hq.webp';
    heroImage.srcset='assets/hero-main-hq.webp 1672w';
    heroImage.sizes='100vw';
    heroImage.loading='eager';
    heroImage.decoding='async';
    heroImage.setAttribute('fetchpriority','high');
  };

  const loadBaseScript=()=>new Promise(resolve=>{
    const base=document.createElement('script');
    base.src='script-base.js';
    base.onload=resolve;
    base.onerror=resolve;
    document.body.appendChild(base);
  });

  const enhanceResults=()=>{
    const works=document.getElementById('works');
    if(!works)return;
    const cards=Array.from({length:7},(_,i)=>{
      const n=String(i+1).padStart(2,'0');
      return `<article class="result-video-card">
        <div class="result-video-frame">
          <video class="result-video" controls playsinline preload="metadata" poster="assets/result-${n}-poster.webp" aria-label="Результат работы VALERI HAIR STUDIO ${i+1}">
            <source src="assets/result-${n}.mp4" type="video/mp4">
          </video>
          <span class="result-video-number">${n}</span>
        </div>
        <div class="result-video-caption"><span>Результат работы</span><strong>VALERI HAIR STUDIO</strong></div>
      </article>`;
    }).join('');

    works.innerHTML=`<div class="section-pad">
      <div class="section-head light">
        <div><p class="eyebrow">Результаты</p><h2>Волосы, к которым хочется прикасаться</h2></div>
        <p>Реальные результаты работ VALERI HAIR STUDIO. Листайте галерею и запускайте видео, чтобы рассмотреть волосы в движении и увидеть результат ближе.</p>
      </div>
      <div class="results-video-gallery" aria-label="Видео с результатами работ VALERI HAIR STUDIO">${cards}</div>
      <p class="results-swipe-hint">Листайте в сторону · нажмите ▶ для просмотра</p>
    </div>`;

    const videos=works.querySelectorAll('.result-video');
    videos.forEach(video=>video.addEventListener('play',()=>{
      videos.forEach(other=>{if(other!==video&&!other.paused)other.pause();});
    }));
    if('IntersectionObserver' in window){
      const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
        if(!entry.isIntersecting&&!entry.target.paused)entry.target.pause();
      }),{threshold:.08});
      videos.forEach(video=>observer.observe(video));
    }
  };

  const enhanceAtmosphere=()=>{
    const gallery=document.querySelector('.studio-gallery');
    if(!gallery)return;

    gallery.querySelectorAll('figure').forEach(figure=>{
      const caption=figure.querySelector('figcaption')?.textContent?.trim().toLowerCase();
      if(caption==='пространство студии')figure.remove();
    });

    const items=[
      {src:'assets/atmosphere-coffee.webp',alt:'Горячий кофе и сладкий комплимент для гостей VALERI HAIR STUDIO',caption:'Тёплый кофе'},
      {src:'assets/atmosphere-studio.webp',alt:'Светлый интерьер VALERI HAIR STUDIO',caption:'Свет студии'},
      {src:'assets/atmosphere-menu.webp',alt:'Меню комплиментов для гостей VALERI HAIR STUDIO',caption:'Меню комплиментов'}
    ];

    items.forEach(item=>{
      if(gallery.querySelector(`img[src="${item.src}"]`))return;
      const figure=document.createElement('figure');
      figure.className='studio-shot';
      figure.innerHTML=`<img alt="${item.alt}" loading="lazy" src="${item.src}"><figcaption>${item.caption}</figcaption>`;
      gallery.appendChild(figure);
    });
  };

  enhanceHero();
  loadBaseScript().then(()=>{
    enhanceResults();
    enhanceAtmosphere();
  });
})();
