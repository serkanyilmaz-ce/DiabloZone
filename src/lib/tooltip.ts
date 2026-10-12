// Presentation only: preserve the exact template/formulas in the sealed archive.
// Unresolved values are a dash, never a fabricated zero or evaluated game value.
export function readableTooltip(value:string|undefined):string{
  if(!value)return '';
  let out='';
  for(let i=0;i<value.length;i++){
    const open=value[i];
    if(open==='{'||open==='['){
      const close=open==='{'?'}':']';let depth=1,token='';
      while(depth&&++i<value.length){const ch=value[i];if(ch===open)depth++;else if(ch===close)depth--;if(depth)token+=ch;}
      if(open==='{'&&/^(?:\/?c(?:_|$)|\/?u$|\/?if(?::|$)|icon:|plural:|color:)/i.test(token))continue;
      out+='—';
    }else out+=open;
  }
  return out.replaceAll('\r\n','\n').replace(/<[^>]*>/g,'').replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}
