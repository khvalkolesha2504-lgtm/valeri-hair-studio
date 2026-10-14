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

  const enhanceNavigation=()=>{
    document.querySelectorAll('a[href="#top"]').forEach(link=>{
      link.addEventListener('click',event=>{
        event.preventDefault();
        window.scrollTo({top:0,left:0,behavior:'smooth'});
        document.querySelector('.main-nav')?.classList.remove('open');
        document.querySelector('.menu-toggle')?.setAttribute('aria-expanded','false');
        if(history.replaceState)history.replaceState(null,'',location.pathname+location.search);
      });
    });
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

    const resultCount=7;
    const cards=Array.from({length:resultCount},(_,i)=>{
      const n=String(i+1).padStart(2,'0');
      return `<article class="result-video-card">
        <div class="result-video-frame">
          <video class="result-video" controls playsinline preload="metadata" poster="assets/result-${n}-poster.webp" aria-label="Результат работы VALERI HAIR STUDIO ${i+1}">
            <source src="assets/result-${n}.mp4" type="video/mp4">
          </video>
          <span class="result-video-number">${n}</span>
        </div>
        <div class="result-video-caption"><span>Результат работы</span><strong>VALERI HAIR STUDIO</strong></div>
        <button class="result-open" type="button" data-result-open="${i}">Смотреть крупно <span>↗</span></button>
      </article>`;
    }).join('');

    works.innerHTML=`<div class="section-pad">
      <div class="section-head light">
        <div><p class="eyebrow">Результаты</p><h2>Волосы, к которым хочется прикасаться</h2></div>
        <p>Реальные результаты работ VALERI HAIR STUDIO. Листайте галерею и открывайте видео крупно, чтобы рассмотреть волосы в движении и увидеть результат ближе.</p>
      </div>
      <div class="results-toolbar" aria-label="Управление галереей результатов">
        <p>Листайте видео</p>
        <div class="results-nav">
          <button class="results-nav-btn results-prev" type="button" aria-label="Предыдущее видео">←</button>
          <button class="results-nav-btn results-next" type="button" aria-label="Следующее видео">→</button>
        </div>
      </div>
      <div class="results-video-gallery" aria-label="Видео с результатами работ VALERI HAIR STUDIO">${cards}</div>
      <p class="results-swipe-hint">Свайп на телефоне · стрелки на компьютере · «Смотреть крупно» для полного просмотра</p>
    </div>`;

    const gallery=works.querySelector('.results-video-gallery');
    const prev=works.querySelector('.results-prev');
    const next=works.querySelector('.results-next');
    const cardStep=()=>{
      const card=gallery?.querySelector('.result-video-card');
      if(!card)return 300;
      const styles=getComputedStyle(gallery);
      const gap=parseFloat(styles.columnGap||styles.gap||18)||18;
      return card.getBoundingClientRect().width+gap;
    };
    prev?.addEventListener('click',()=>gallery?.scrollBy({left:-cardStep(),behavior:'smooth'}));
    next?.addEventListener('click',()=>gallery?.scrollBy({left:cardStep(),behavior:'smooth'}));

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

    if(!document.getElementById('resultVideoModal')){
      document.body.insertAdjacentHTML('beforeend',`
        <div class="result-modal" id="resultVideoModal" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Просмотр результата работы">
          <div class="result-modal-backdrop" data-result-close></div>
          <div class="result-modal-shell">
            <button class="result-modal-close" type="button" aria-label="Закрыть видео" data-result-close>×</button>
            <button class="result-modal-arrow result-modal-prev" type="button" aria-label="Предыдущее видео">←</button>
            <div class="result-modal-stage">
              <video class="result-modal-video" controls playsinline preload="metadata"></video>
              <div class="result-modal-meta">
                <span class="result-modal-counter">01 / 07</span>
                <strong>VALERI HAIR STUDIO</strong>
              </div>
            </div>
            <button class="result-modal-arrow result-modal-next" type="button" aria-label="Следующее видео">→</button>
          </div>
        </div>`);
    }

    const modal=document.getElementById('resultVideoModal');
    const modalVideo=modal?.querySelector('.result-modal-video');
    const modalCounter=modal?.querySelector('.result-modal-counter');
    let activeIndex=0;
    const hqAvailability=new Map();

    const chooseVideoSource=async index=>{
      const n=String(index+1).padStart(2,'0');
      const hq=`assets/result-${n}-hq.mp4`;
      const standard=`assets/result-${n}.mp4`;
      if(hqAvailability.has(n))return hqAvailability.get(n)?hq:standard;
      try{
        const response=await fetch(hq,{method:'HEAD',cache:'no-store'});
        const available=response.ok;
        hqAvailability.set(n,available);
        return available?hq:standard;
      }catch(_){
        hqAvailability.set(n,false);
        return standard;
      }
    };

    const showResult=async index=>{
      if(!modal||!modalVideo)return;
      activeIndex=(index+resultCount)%resultCount;
      videos.forEach(video=>{if(!video.paused)video.pause();});
      const n=String(activeIndex+1).padStart(2,'0');
      modal.classList.add('open');
      modal.setAttribute('aria-hidden','false');
      document.body.classList.add('result-modal-open');
      modalCounter.textContent=`${n} / ${String(resultCount).padStart(2,'0')}`;
      modalVideo.poster=`assets/result-${n}-poster.webp`;
      modalVideo.pause();
      modalVideo.removeAttribute('src');
      modalVideo.load();
      const requestedIndex=activeIndex;
      const source=await chooseVideoSource(requestedIndex);
      if(!modal.classList.contains('open')||activeIndex!==requestedIndex)return;
      modalVideo.src=source;
      modalVideo.load();
    };

    const closeModal=()=>{
      if(!modal||!modalVideo)return;
      modalVideo.pause();
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden','true');
      document.body.classList.remove('result-modal-open');
    };

    works.querySelectorAll('[data-result-open]').forEach(button=>{
      button.addEventListener('click',()=>showResult(Number(button.dataset.resultOpen)));
    });
    modal?.querySelectorAll('[data-result-close]').forEach(button=>button.addEventListener('click',closeModal));
    modal?.querySelector('.result-modal-prev')?.addEventListener('click',()=>showResult(activeIndex-1));
    modal?.querySelector('.result-modal-next')?.addEventListener('click',()=>showResult(activeIndex+1));

    document.addEventListener('keydown',event=>{
      if(!modal?.classList.contains('open'))return;
      if(event.key==='Escape')closeModal();
      if(event.key==='ArrowLeft')showResult(activeIndex-1);
      if(event.key==='ArrowRight')showResult(activeIndex+1);
    });
  };

  const enhanceAtmosphere=()=>{
    const gallery=document.querySelector('.studio-gallery');
    if(!gallery)return;

    gallery.querySelectorAll('figure').forEach(figure=>{
      const caption=figure.querySelector('figcaption')?.textContent?.trim().toLowerCase();
      if(caption==='пространство студии'||caption==='зона ожидания')figure.remove();
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
  enhanceNavigation();
  loadBaseScript().then(()=>{
    enhanceResults();
    enhanceAtmosphere();
  });
})();
