import {englishUi} from './ui-translations';
import localeManifest from '../../data/research/localization-manifest.json';
export type Locale='tr'|'en';
type Fields=Record<string,{en:string;tr:string}>;
let game:Record<string,Fields>={};
const originals=new WeakMap<Node,{source:string;rendered:string}>();
const attributes=new WeakMap<Element,Map<string,{source:string;rendered:string}>>();
const entities=new WeakMap<Element,{key:string;source:string;rendered:string}>();
const phrases=new Map<string,string>();
const turkishLabels:Record<string,string>={Sorcerer:'Büyücü',Necromancer:'Ölüm Büyücüsü',Barbarian:'Barbar',Rogue:'Haydut',Spiritborn:'Ruhdoğumlu',Warlock:'Kara Büyücü',basic:'Temel',core:'Çekirdek',defensive:'Savunma',offensive:'Saldırı',passive:'Pasif',modifier:'Geliştirme',active:'Aktif'};
export const currentLocale=():Locale=>document.documentElement.lang==='en'?'en':'tr';
export function gameText(key:string,field='name',locale:Locale=currentLocale()){return game[key]?.[field]?.[locale]?.replaceAll('\r\n','\n');}
export function bilingualSearch(key:string){const fields=game[key];return fields?Object.values(fields).flatMap(f=>[f.en,f.tr]).join(' '):'';}
function translated(source:string){
  if(currentLocale()==='en')return englishUi(source);
  const tr=phrases.get(source.trim())??turkishLabels[source.trim()];
  if(tr)return source.replace(source.trim(),tr);
  if(source.includes(' · ')||source.endsWith(' →'))return source.split(/( · | →)/).map(part=>phrases.get(part.trim())??turkishLabels[part.trim()]??part).join('');
  return source;
}
function protectedNode(element:Element|null){return !element||!!element.closest('script,style,pre,code,[data-no-i18n],[data-game-field]');}
export function localize(root:Element=document.body){
  const entityElements=[...(root.matches('[data-game-field]')?[root]:[]),...root.querySelectorAll('[data-game-field]')];
  for(const element of entityElements){
    const key=element.getAttribute('data-game-key')??element.closest('[data-game-key]')?.getAttribute('data-game-key');
    const current=element.textContent??'';let state=entities.get(element);if(!state||state.key!==key||current!==state.rendered)state={key:key??'',source:current,rendered:current};
    const text=key?gameText(key,element.getAttribute('data-game-field')!):undefined;
    const output=text??(currentLocale()==='en'?englishUi(state.source):state.source);state.rendered=output;entities.set(element,state);if(element.textContent!==output)element.textContent=output;
  }
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:node=>protectedNode(node.parentElement)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  while(walker.nextNode()){
    const node=walker.currentNode;let state=originals.get(node);const current=node.nodeValue??'';
    if(!state||current!==state.rendered)state={source:current,rendered:current};
    const output=translated(state.source);state.rendered=output;originals.set(node,state);if(output!==current)node.nodeValue=output;
  }
  for(const el of [root,...root.querySelectorAll('[placeholder],[aria-label],[title],meta[name="description"],a[href]')]){
    if(el.closest('pre,code,script,style,[data-no-i18n]'))continue;
    const memory=attributes.get(el)??new Map();attributes.set(el,memory);
    for(const attr of ['placeholder','aria-label','title','content','href']){
      if(!el.hasAttribute(attr)||attr==='content'&&el.tagName!=='META'||attr==='href'&&el.tagName!=='A')continue;
      const value=el.getAttribute(attr)!;let state=memory.get(attr);if(!state||state.rendered!==value)state={source:value,rendered:value};
      let output=translated(state.source);
      if(attr==='href'){
        output=state.source;
        if(!output.startsWith('#')){const url=new URL(output,location.href);if(url.origin===location.origin&&!url.pathname.startsWith('/api/')&&!/\.(json|png|svg|css|js)$/.test(url.pathname)){url.searchParams.set('lang',currentLocale());output=url.pathname+url.search+url.hash;}}
      }
      state.rendered=output;memory.set(attr,state);if(value!==output)el.setAttribute(attr,output);
    }
  }
}
function persist(key:string,value:string){try{localStorage.setItem(key,value);}catch{/* Preference still works when storage is unavailable. */}}
export function initializePreferences(){
  const language=document.querySelector<HTMLSelectElement>('[data-language]');
  const theme=document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  const hero=document.querySelector<HTMLFormElement>('form.hero-search');
  if(hero&&!hero.querySelector('[name="lang"]')){const input=document.createElement('input');input.type='hidden';input.name='lang';hero.append(input);}
  function themeLabel(){const dark=document.documentElement.dataset.theme==='dark';if(theme){theme.setAttribute('aria-label',dark?'Açık tema':'Koyu tema');theme.setAttribute('aria-pressed',String(!dark));}document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#101114':'#f6f1e8');}
  function update(locale:Locale){
    document.documentElement.lang=locale;document.documentElement.dataset.locale=locale;
    if(language)language.value=locale;const url=new URL(location.href);url.searchParams.set('lang',locale);history.replaceState(null,'',url);
    hero?.querySelector<HTMLInputElement>('[name="lang"]')?.setAttribute('value',locale);
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href',url.origin+url.pathname);
    localize();localize(document.head);document.dispatchEvent(new CustomEvent('dz:language',{detail:{locale}}));
  }
  theme?.addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='light'?'dark':'light';document.documentElement.dataset.theme=next;persist('diablozone.theme',next);themeLabel();localize();});
  language?.addEventListener('change',()=>{const locale=language.value==='en'?'en':'tr';persist('diablozone.locale',locale);update(locale);});
  themeLabel();persist('diablozone.locale',currentLocale());update(currentLocale());
  let queued=false;
  new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;localize();});}).observe(document.body,{subtree:true,childList:true,characterData:true});
  void fetch(new URL(localeManifest.url,new URL(document.documentElement.dataset.base??'/',location.origin)).href,{cache:'force-cache'}).then(async response=>{
    if(!response.ok)throw new Error('Locale fetch failed');const body=await response.json();
    if(body.localeSetId!==localeManifest.localeSetId||body.inputSha256!==localeManifest.inputSha256||body.gameSnapshotId!==localeManifest.gameSnapshotId||typeof body.records!=='object')throw new Error('Locale context mismatch');
    game=body.records;const ambiguous=new Set<string>();
    for(const fields of Object.values(game))for(const field of Object.values(fields)){if(!field.en||!field.tr)continue;const en=field.en.replaceAll('\r\n','\n'),tr=field.tr.replaceAll('\r\n','\n');const prior=phrases.get(en);if(prior&&prior!==tr)ambiguous.add(en);else phrases.set(en,tr);}
    for(const text of ambiguous)phrases.delete(text);
    // Existing text states retain their English originals across language switches.
    localize();localize(document.head);document.dispatchEvent(new CustomEvent('dz:locale-ready'));
    document.documentElement.dataset.translationStatus='ready';
  }).catch(()=>{document.documentElement.dataset.translationStatus='unavailable';const note=document.querySelector<HTMLElement>('[data-language-status]');if(note){note.hidden=false;note.textContent=currentLocale()==='tr'?'Oyun çevirisi yüklenemedi. Sayfayı yenileyebilirsin.':'Game translations could not be loaded. Try reloading the page.';}});
  window.addEventListener('storage',event=>{if(event.key==='diablozone.locale'&&(event.newValue==='tr'||event.newValue==='en'))update(event.newValue);if(event.key==='diablozone.theme'&&(event.newValue==='dark'||event.newValue==='light')){document.documentElement.dataset.theme=event.newValue;themeLabel();localize();}});
}
