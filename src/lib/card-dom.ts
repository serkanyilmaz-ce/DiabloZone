import type {CatalogueCard} from './catalogue-cards';
import {iconSvg} from './icons';
import {labelSegments} from './presentation';
// Client mirror of CatalogueCardView.astro; keep both markups identical.
function textElement(tag:string,text:string,className?:string){const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;return el;}
export function appendSegments(parent:Element,segments:Array<{value:boolean;text:string}>){
  for(const segment of segments){
    if(segment.value){const mark=textElement('span',segment.text,'value-token');mark.title='Kaynakta sayısal değeri çözülmemiş alan';parent.append(mark);}
    else parent.append(document.createTextNode(segment.text));
  }
}
export function drawCard(card:CatalogueCard,base:string){
  const link=document.createElement('a');link.className=`data-card kind-${card.kind}${card.rarity?` rarity-${card.rarity}`:''}`;link.href=base+card.kind+'/'+card.slug+'/';
  link.dataset.entry='';link.dataset.class=card.classes[0]??'';link.dataset.type=card.filters.type;
  const main=document.createElement('div');main.className='card-main';
  const frame=document.createElement('span');frame.className='card-icon';
  if(card.icon){const img=document.createElement('img');img.src=base+card.icon;img.className='entity-icon';img.width=64;img.height=64;img.alt='';img.loading='lazy';frame.append(img);}
  else{const fallback=document.createElement('span');fallback.className='entity-fallback';fallback.title='Özgün ikon henüz bulunamadı';fallback.innerHTML=iconSvg(card.fallback,26);frame.append(fallback);}
  const name=textElement('h2',card.name);name.dataset.gameKey=`${card.kind}:${card.id}`;name.dataset.gameField='name';if(card.nameStyle)name.dataset.nameStyle=card.nameStyle;
  const copy=document.createElement('div');copy.className='card-copy';copy.append(textElement('p',card.kicker,'card-kicker'),name);main.append(frame,copy);link.append(main);
  if(card.properties?.length){
    const list=document.createElement('ul');list.className='item-props';
    for(const line of card.properties){
      const item=document.createElement('li');item.className=`prop-${line.kind}`;
      if(line.kind==='power'){item.dataset.gameKey=`affixes:${line.affixId}`;item.dataset.gameField='description';item.textContent=line.en;}
      else{item.dataset.noI18n='';for(const [locale,text] of [['en',line.en],['tr',line.tr??line.en]] as const){const span=document.createElement('span');span.dataset.localeOnly=locale;appendSegments(span,labelSegments(text));item.append(span);}}
      list.append(item);
    }
    link.append(list);
  }
  if(card.description){const description=textElement('p',card.description,'card-desc');description.dataset.gameKey=`${card.kind}:${card.id}`;description.dataset.gameField=card.descriptionField??'description';link.append(description);}
  if(card.chips.length){const chips=document.createElement('div');chips.className='chip-row';for(const chip of card.chips)chips.append(textElement('span',chip,'chip'));link.append(chips);}
  return link;
}
