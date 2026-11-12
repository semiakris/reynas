(()=>{
 const languages={tr:'Türkçe',en:'English',de:'Deutsch',fr:'Français',es:'Español',zh:'简体中文',ru:'Русский'};
 let language='tr',dictionary={},observer;const originals=new WeakMap(),attributes=new WeakMap();
 try{const stored=localStorage.getItem('reynas-language');if(languages[stored])language=stored}catch{}
 function t(text){if(language==='tr')return text;if(dictionary[text]?.[language])return dictionary[text][language];let match;
 const template=(key,values)=>(dictionary[key]?.[language]||text).replace(/\{(\d+)\}/g,(_,i)=>values[i]||'');
 if(match=text.match(/^([\d.,]+) ücretsiz font ailesi · ([\d.,]+) sonuç(.*)$/))return template('__fonts__',[match[1],match[2]])+(match[3]?dictionary.__no_font__?.[language]||'':'');
 if(match=text.match(/^(.+) yükleniyor…$/))return template('__loading__',[match[1]]);
 if(match=text.match(/^(.+) hazır · (.+)$/))return template('__ready__',[match[1],t(match[2])]);
 return text;
 }
 window.reynasI18n={t,get language(){return language}};
 const control=document.createElement('button');control.type='button';control.className='language-button';control.setAttribute('aria-label','Dil seçimi / Language');control.innerHTML='◎ <span>'+language.toUpperCase()+'</span>';document.querySelector('header').append(control);
 const dialog=document.createElement('dialog');dialog.className='language-dialog';dialog.dir='ltr';dialog.innerHTML='<button type="button" class="language-close" aria-label="Close / Kapat">×</button><p class="eyebrow">REYNAS / WORLDWIDE</p><h2>Hoş geldiniz.<br><em>Welcome.</em></h2><p>Dilinizi seçin / Choose your language</p><div class="language-options"></div>';document.body.append(dialog);
 for(const [code,name] of Object.entries(languages)){const b=document.createElement('button');b.type='button';b.lang=code==='zh'?'zh-Hans':code;b.dir=code==='ur'?'rtl':'ltr';b.textContent=name;b.dataset.language=code;b.onclick=()=>{language=code;try{localStorage.setItem('reynas-language',code)}catch{}apply();dialog.close()};dialog.querySelector('.language-options').append(b)}
 control.onclick=()=>dialog.showModal();dialog.querySelector('.language-close').onclick=()=>dialog.close();
 function translateNode(node){const parent=node.parentElement;if(!parent||parent.closest('script,style,textarea,input,.language-dialog,#artwork-name'))return;const current=node.textContent,record=originals.get(node);let original=record&&current===record.last?record.original:current;const key=original.trim();if(!key)return;const next=original.replace(key,t(key));if(current!==next)node.textContent=next;originals.set(node,{original,last:next})}
 function walk(root){if(root.nodeType===3){translateNode(root);return}if(root.nodeType!==1)return;root.querySelectorAll('option:not([value])').forEach(o=>o.setAttribute('value',o.textContent));const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(walker.nextNode())translateNode(walker.currentNode);for(const el of [root,...root.querySelectorAll('[placeholder],[aria-label],[title]')]){if(el.closest('.language-dialog'))continue;for(const attr of ['placeholder','aria-label','title']){if(!el.hasAttribute(attr))continue;const records=attributes.get(el)||{},current=el.getAttribute(attr),r=records[attr],original=r&&current===r.last?r.original:current,next=t(original);if(next!==current)el.setAttribute(attr,next);records[attr]={original,last:next};attributes.set(el,records)}}}
 function apply(){observer?.disconnect();walk(document.body);document.documentElement.lang=language==='zh'?'zh-Hans':language;document.documentElement.dir=language==='ur'?'rtl':'ltr';document.title=location.pathname.includes('tasarla')?(t('Etiketini tasarla')+' — REYNAS'):'REYNAS';control.querySelector('span').textContent=language.toUpperCase();dialog.querySelectorAll('[data-language]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.language===language));observe()}
 function observe(){observer?.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']})}
 observer=new MutationObserver(mutations=>{observer.disconnect();for(const m of mutations){if(m.type==='characterData')translateNode(m.target);else if(m.type==='attributes')walk(m.target);else m.addedNodes.forEach(walk)}observe()});
 fetch('translations.json').then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{dictionary=data;apply()}).catch(()=>{language='tr';apply();control.title='Translations unavailable; please reload.'});
 let chosen=false;try{chosen=!!localStorage.getItem('reynas-language')}catch{}
 if(!chosen&&!location.hash)dialog.showModal();
})();
