(()=>{
  const enhanceSEO=()=>{
    document.title='Восстановление волос в Минске — VALERI HAIR STUDIO';

    const description='Восстановление и реконструкция волос в Минске в VALERI HAIR STUDIO. Кератин, ботокс, уход за повреждёнными волосами, индивидуальная диагностика и онлайн-запись.';
    let metaDescription=document.querySelector('meta[name="description"]');
    if(!metaDescription){
      metaDescription=document.createElement('meta');
      metaDescription.name='description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content=description;

    let canonical=document.querySelector('link[rel="canonical"]');
    if(!canonical){
      canonical=document.createElement('link');
      canonical.rel='canonical';
      document.head.appendChild(canonical);
    }
    canonical.href='https://valerihairstudio.ru/';

    let favicon=document.querySelector('link[rel~="icon"]');
    if(!favicon){
      favicon=document.createElement('link');
      favicon.rel='icon';
      document.head.appendChild(favicon);
    }
    favicon.type='image/svg+xml';
    favicon.href='/favicon.svg';

    const upsertMeta=(selector,attr,name,content)=>{
      let meta=document.querySelector(selector);
      if(!meta){
        meta=document.createElement('meta');
        meta.setAttribute(attr,name);
        document.head.appendChild(meta);
      }
      meta.content=content;
    };
    upsertMeta('meta[property="og:title"]','property','og:title','Восстановление волос в Минске — VALERI HAIR STUDIO');
    upsertMeta('meta[property="og:description"]','property','og:description',description);
    upsertMeta('meta[property="og:url"]','property','og:url','https://valerihairstudio.ru/');
    upsertMeta('meta[property="og:type"]','property','og:type','website');
    upsertMeta('meta[name="robots"]','name','robots','index,follow,max-image-preview:large');
  };

  const enhanceStyles=()=>{
    if(document.querySelector('link[data-valeri-results-style]'))return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='results-overrides.css';
    link.dataset.valeriResultsStyle='true';
    document.head.appendChild(link);
  };

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

    const pairs=Array.from({length:7},(_,index)=>({
      index,
      src:`assets/result-compare-${String(index).padStart(2,'0')}.webp`,
      rightLabel:index===4?'Спустя время':'После'
    }));

    const cards=pairs.map(item=>{
      const n=String(item.index+1).padStart(2,'0');
      const caption=item.index===4?'До / спустя время':'До / после';
      return `<article class="compare-card">
        <div class="compare-frame" style="--pos:50%">
          <div class="compare-layer compare-before" style="background-image:url('${item.src}')"></div>
          <div class="compare-layer compare-after" style="background-image:url('${item.src}')"></div>
          <span class="compare-label compare-label-before">До</span>
          <span class="compare-label compare-label-after">${item.rightLabel}</span>
          <div class="compare-divider" aria-hidden="true"><span>↔</span></div>
          <input class="compare-range" type="range" min="0" max="100" value="50" aria-label="Сравнить фото до и после — результат ${item.index+1}">
        </div>
        <div class="compare-caption"><span>Результат ${n}</span><strong>${caption}</strong></div>
      </article>`;
    }).join('');

    works.innerHTML=`<div class="section-pad">
      <div class="section-head light">
        <div><p class="eyebrow">Результаты</p><h2>Волосы, к которым хочется прикасаться</h2></div>
        <p>Реальные результаты работ VALERI HAIR STUDIO. Передвигайте ползунок на фотографии, чтобы сравнить состояние волос до процедуры и результат после.</p>
      </div>
      <div class="results-toolbar" aria-label="Управление галереей результатов">
        <p>Передвигайте ползунок «До / После»</p>
        <div class="results-nav">
          <button class="results-nav-btn results-prev" type="button" aria-label="Предыдущий результат">←</button>
          <button class="results-nav-btn results-next" type="button" aria-label="Следующий результат">→</button>
        </div>
      </div>
      <div class="results-compare-gallery" aria-label="Сравнение результатов до и после">${cards}</div>
      <p class="results-swipe-hint">Двигайте ползунок на фото · листайте галерею · стрелки переключают результаты</p>
    </div>`;

    works.querySelectorAll('.compare-frame').forEach(frame=>{
      const input=frame.querySelector('.compare-range');
      if(!input)return;
      const update=()=>frame.style.setProperty('--pos',`${input.value}%`);
      input.addEventListener('input',update);
      input.addEventListener('change',update);
      update();
    });

    const gallery=works.querySelector('.results-compare-gallery');
    const prev=works.querySelector('.results-prev');
    const next=works.querySelector('.results-next');
    const cardStep=()=>{
      const card=gallery?.querySelector('.compare-card');
      if(!card)return 300;
      const styles=getComputedStyle(gallery);
      const gap=parseFloat(styles.columnGap||styles.gap||18)||18;
      return card.getBoundingClientRect().width+gap;
    };
    prev?.addEventListener('click',()=>gallery?.scrollBy({left:-cardStep(),behavior:'smooth'}));
    next?.addEventListener('click',()=>gallery?.scrollBy({left:cardStep(),behavior:'smooth'}));
  };

  const enhanceAtmosphere=()=>{
    const gallery=document.querySelector('.studio-gallery');
    if(!gallery)return;

    gallery.querySelectorAll('figure').forEach(figure=>{
      const caption=figure.querySelector('figcaption')?.textContent?.trim().toLowerCase();
      if(caption==='пространство студии'||caption==='зона ожидания')figure.remove();
    });

    const newItems=[
      {src:'assets/studio-new-01.webp',alt:'Зона ухода и мойка VALERI HAIR STUDIO в Минске',caption:'Зона ухода'},
      {src:'assets/studio-new-02.webp',alt:'Детали сервиса и фирменный логотип VALERI HAIR STUDIO',caption:'Детали сервиса'}
    ];

    [...newItems].reverse().forEach(item=>{
      if(gallery.querySelector(`img[src="${item.src}"]`))return;
      const figure=document.createElement('figure');
      figure.className='studio-shot';
      figure.innerHTML=`<img alt="${item.alt}" loading="lazy" src="${item.src}"><figcaption>${item.caption}</figcaption>`;
      gallery.insertBefore(figure,gallery.firstElementChild);
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

  const enhanceTraining=()=>{
    const hero=document.querySelector('#training .training-hero img');
    if(hero){
      hero.src='assets/training-new.webp';
      hero.alt='Валерия с ученицей после индивидуального обучения в VALERI HAIR STUDIO';
    }

    const figures=document.querySelectorAll('#training .training-gallery figure');
    const target=figures[1];
    const image=target?.querySelector('img');
    const caption=target?.querySelector('figcaption');
    if(image){
      image.src='assets/training-new.webp';
      image.alt='Валерия с ученицей и сертификатом после индивидуального обучения';
    }
    if(caption)caption.textContent='Индивидуальное обучение · Валерия с ученицей';
  };

  enhanceSEO();
  enhanceStyles();
  enhanceHero();
  enhanceNavigation();
  loadBaseScript().then(()=>{
    enhanceResults();
    enhanceAtmosphere();
    enhanceTraining();
  });
})();
