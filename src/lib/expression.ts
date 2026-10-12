// Deliberately limited numeric grammar. No JavaScript execution, functions,
// member access, assignments, strings or implicit game lookup resolution.
type Node={type:'number';value:number}|{type:'symbol';name:string}|{type:'unary';op:string;value:Node}|{type:'binary';op:string;left:Node;right:Node}|{type:'conditional';condition:Node;yes:Node;no:Node};
interface Token{value:string;type:'number'|'symbol'|'operator'}
const precedence:Record<string,number>={'||':1,'&&':2,'==':3,'!=':3,'<':4,'<=':4,'>':4,'>=':4,'+':5,'-':5,'*':6,'/':6,'%':6};
export function parseExpression(expression:string):{ast:Node;symbols:string[]}{
  if(!expression.trim()||expression.length>4096)throw new Error('Boş veya çok uzun ifade.');
  const tokens:Token[]=[];let index=0;
  while(index<expression.length){
    const tail=expression.slice(index),space=tail.match(/^\s+/);if(space){index+=space[0].length;continue;}
    const numeric=tail.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
    const symbol=tail.match(/^[A-Za-z_][A-Za-z0-9_]*/);
    const operator=tail.match(/^(?:&&|\|\||==|!=|<=|>=|[+*/%()?:!<>-])/);
    const match=numeric??symbol??operator;if(!match)throw new Error(`Desteklenmeyen sözdizimi: karakter ${index+1}.`);
    tokens.push({value:match[0],type:numeric?'number':symbol?'symbol':'operator'});index+=match[0].length;
    if(tokens.length>512)throw new Error('İfade token sınırını aştı.');
  }
  let cursor=0;const symbols=new Set<string>();
  const peek=()=>tokens[cursor]?.value;
  const take=(expected:string)=>{if(peek()!==expected)throw new Error(`Beklenen işaret: ${expected}.`);cursor++;};
  function parse(minimum=0,depth=0):Node{
    if(depth>48)throw new Error('İfade derinlik sınırını aştı.');
    const token=tokens[cursor++];if(!token)throw new Error('Eksik ifade.');let left:Node;
    if(token.type==='number'){const value=Number(token.value);if(!Number.isFinite(value))throw new Error('Sonlu olmayan sabit.');left={type:'number',value};}
    else if(token.type==='symbol'){symbols.add(token.value);left={type:'symbol',name:token.value};}
    else if(token.value==='('){left=parse(0,depth+1);take(')');}
    else if(['+','-','!'].includes(token.value))left={type:'unary',op:token.value,value:parse(7,depth+1)};
    else throw new Error('Geçersiz başlangıç.');
    while((precedence[peek()??'']??-1)>=minimum){const op=tokens[cursor++].value;left={type:'binary',op,left,right:parse(precedence[op]+1,depth+1)};}
    if(minimum===0&&peek()==='?'){cursor++;const yes=parse(0,depth+1);take(':');left={type:'conditional',condition:left,yes,no:parse(0,depth+1)};}
    return left;
  }
  const ast=parse();if(cursor!==tokens.length)throw new Error('Desteklenmeyen devam; fonksiyon ve lookup ifadeleri çözülmez.');
  return {ast,symbols:[...symbols].sort()};
}
export function evaluateExpression(ast:Node,inputs:Record<string,number>={}):number{
  const finite=(n:number)=>{if(!Number.isFinite(n))throw new Error('Sonlu sonuç üretilemedi.');return n;};
  function visit(node:Node):number{
    if(node.type==='number')return node.value;
    if(node.type==='symbol'){if(!Object.hasOwn(inputs,node.name))throw new Error(`Eksik girdi: ${node.name}.`);return finite(inputs[node.name]);}
    if(node.type==='conditional')return visit(node.condition)!==0?visit(node.yes):visit(node.no);
    if(node.type==='unary'){const n=visit(node.value);return node.op==='!'?Number(!n):finite(node.op==='-'?-n:n);}
    const a=visit(node.left);
    if(node.op==='&&')return a?Number(visit(node.right)!==0):0;
    if(node.op==='||')return a?1:Number(visit(node.right)!==0);
    const b=visit(node.right);
    if((node.op==='/'||node.op==='%')&&b===0)throw new Error('Sıfıra bölme.');
    switch(node.op){
      case '+':return finite(a+b);case '-':return finite(a-b);case '*':return finite(a*b);case '/':return finite(a/b);case '%':return finite(a%b);
      case '<':return Number(a<b);case '<=':return Number(a<=b);case '>':return Number(a>b);case '>=':return Number(a>=b);case '==':return Number(a===b);case '!=':return Number(a!==b);
      default:throw new Error('Desteklenmeyen işlem.');
    }
  }
  return visit(ast);
}
