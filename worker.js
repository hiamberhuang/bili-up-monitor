/**
 * B站UP稿件查询 · Cloudflare Worker 中转
 * 作用：服务器端做 wbi 签名 + 抓 B 站接口 + 放行跨域，让任何静态网页都能直接调。
 * 无需任何登录/cookie。部署见 README。
 * GET /?mid=<UID>&n=<近几条，默认10，最多30>
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

/* ---- md5（wbi 签名用，Worker 无内置 md5，自带一份） ---- */
const md5 = (function () {
  function sa(x,y){var l=(x&0xFFFF)+(y&0xFFFF);return((x>>16)+(y>>16)+(l>>16)<<16)|(l&0xFFFF);}
  function rl(n,c){return(n<<c)|(n>>>(32-c));}
  function cm(q,a,b,x,s,t){return sa(rl(sa(sa(a,q),sa(x,t)),s),b);}
  function ff(a,b,c,d,x,s,t){return cm((b&c)|((~b)&d),a,b,x,s,t);}
  function gg(a,b,c,d,x,s,t){return cm((b&d)|(c&(~d)),a,b,x,s,t);}
  function hh(a,b,c,d,x,s,t){return cm(b^c^d,a,b,x,s,t);}
  function ii(a,b,c,d,x,s,t){return cm(c^(b|(~d)),a,b,x,s,t);}
  function co(x,len){x[len>>5]|=0x80<<(len%32);x[(((len+64)>>>9)<<4)+14]=len;var a=1732584193,b=-271733879,c=-1732584194,d=271733878;for(var i=0;i<x.length;i+=16){var oa=a,ob=b,oc=c,od=d;
    a=ff(a,b,c,d,x[i],7,-680876936);d=ff(d,a,b,c,x[i+1],12,-389564586);c=ff(c,d,a,b,x[i+2],17,606105819);b=ff(b,c,d,a,x[i+3],22,-1044525330);
    a=ff(a,b,c,d,x[i+4],7,-176418897);d=ff(d,a,b,c,x[i+5],12,1200080426);c=ff(c,d,a,b,x[i+6],17,-1473231341);b=ff(b,c,d,a,x[i+7],22,-45705983);
    a=ff(a,b,c,d,x[i+8],7,1770035416);d=ff(d,a,b,c,x[i+9],12,-1958414417);c=ff(c,d,a,b,x[i+10],17,-42063);b=ff(b,c,d,a,x[i+11],22,-1990404162);
    a=ff(a,b,c,d,x[i+12],7,1804603682);d=ff(d,a,b,c,x[i+13],12,-40341101);c=ff(c,d,a,b,x[i+14],17,-1502002290);b=ff(b,c,d,a,x[i+15],22,1236535329);
    a=gg(a,b,c,d,x[i+1],5,-165796510);d=gg(d,a,b,c,x[i+6],9,-1069501632);c=gg(c,d,a,b,x[i+11],14,643717713);b=gg(b,c,d,a,x[i],20,-373897302);
    a=gg(a,b,c,d,x[i+5],5,-701558691);d=gg(d,a,b,c,x[i+10],9,38016083);c=gg(c,d,a,b,x[i+15],14,-660478335);b=gg(b,c,d,a,x[i+4],20,-405537848);
    a=gg(a,b,c,d,x[i+9],5,568446438);d=gg(d,a,b,c,x[i+14],9,-1019803690);c=gg(c,d,a,b,x[i+3],14,-187363961);b=gg(b,c,d,a,x[i+8],20,1163531501);
    a=gg(a,b,c,d,x[i+13],5,-1444681467);d=gg(d,a,b,c,x[i+2],9,-51403784);c=gg(c,d,a,b,x[i+7],14,1735328473);b=gg(b,c,d,a,x[i+12],20,-1926607734);
    a=hh(a,b,c,d,x[i+5],4,-378558);d=hh(d,a,b,c,x[i+8],11,-2022574463);c=hh(c,d,a,b,x[i+11],16,1839030562);b=hh(b,c,d,a,x[i+14],23,-35309556);
    a=hh(a,b,c,d,x[i+1],4,-1530992060);d=hh(d,a,b,c,x[i+4],11,1272893353);c=hh(c,d,a,b,x[i+7],16,-155497632);b=hh(b,c,d,a,x[i+10],23,-1094730640);
    a=hh(a,b,c,d,x[i+13],4,681279174);d=hh(d,a,b,c,x[i],11,-358537222);c=hh(c,d,a,b,x[i+3],16,-722521979);b=hh(b,c,d,a,x[i+6],23,76029189);
    a=hh(a,b,c,d,x[i+9],4,-640364487);d=hh(d,a,b,c,x[i+12],11,-421815835);c=hh(c,d,a,b,x[i+15],16,530742520);b=hh(b,c,d,a,x[i+2],23,-995338651);
    a=ii(a,b,c,d,x[i],6,-198630844);d=ii(d,a,b,c,x[i+7],10,1126891415);c=ii(c,d,a,b,x[i+14],15,-1416354905);b=ii(b,c,d,a,x[i+5],21,-57434055);
    a=ii(a,b,c,d,x[i+12],6,1700485571);d=ii(d,a,b,c,x[i+3],10,-1894986606);c=ii(c,d,a,b,x[i+10],15,-1051523);b=ii(b,c,d,a,x[i+1],21,-2054922799);
    a=ii(a,b,c,d,x[i+8],6,1873313359);d=ii(d,a,b,c,x[i+15],10,-30611744);c=ii(c,d,a,b,x[i+6],15,-1560198380);b=ii(b,c,d,a,x[i+13],21,1309151649);
    a=ii(a,b,c,d,x[i+4],6,-145523070);d=ii(d,a,b,c,x[i+11],10,-1120210379);c=ii(c,d,a,b,x[i+2],15,718787259);b=ii(b,c,d,a,x[i+9],21,-343485551);
    a=sa(a,oa);b=sa(b,ob);c=sa(c,oc);d=sa(d,od);}return[a,b,c,d];}
  function s2b(s){var b=[],i;for(i=0;i<s.length*8;i+=8)b[i>>5]|=(s.charCodeAt(i/8)&255)<<(i%32);return b;}
  function b2h(a){var h="0123456789abcdef",s="",i;for(i=0;i<a.length*4;i++)s+=h.charAt((a[i>>2]>>((i%4)*8+4))&0xF)+h.charAt((a[i>>2]>>((i%4)*8))&0xF);return s;}
  return function(s){return b2h(co(s2b(unescape(encodeURIComponent(s))),s.length*8));};
})();

const TAB=[46,47,18,2,53,8,23,32,15,50,10,31,58,3,45,35,27,43,5,49,33,9,42,19,29,28,14,39,12,38,41,13,37,48,7,16,24,55,40,61,26,17,0,1,60,51,30,4,22,25,54,21,56,59,6,63,57,62,11,36,20,34,44,52];

// 取设备指纹 buvid（无需登录），用于过风控
async function getBuvid(){
  try{
    const r = await fetch('https://api.bilibili.com/x/frontend/finger/spi', {headers:{'User-Agent':UA}});
    const d = await r.json();
    return `buvid3=${d.data.b_3}; buvid4=${d.data.b_4}`;
  }catch(e){ return 'buvid3=' + crypto.randomUUID().toUpperCase() + 'infoc'; }
}
function headers(cookie, ref){
  return {
    'User-Agent': UA,
    'Accept': 'application/json, text/plain, */*',
    'Referer': ref || 'https://www.bilibili.com',
    'Origin': 'https://www.bilibili.com',
    'Cookie': cookie || '',
  };
}
async function getKeys(cookie){
  const r = await fetch('https://api.bilibili.com/x/web-interface/nav', {headers: headers(cookie)});
  const t = await r.text();
  let d; try{ d = JSON.parse(t); }catch(e){ throw new Error('nav 被风控（返回非 JSON）'); }
  return {
    img: d.data.wbi_img.img_url.split('/').pop().split('.')[0],
    sub: d.data.wbi_img.sub_url.split('/').pop().split('.')[0],
  };
}
function sign(params, img, sub){
  const o = img + sub;
  const mk = TAB.map(n => o[n]).join('').slice(0,32);
  params.wts = Math.floor(Date.now()/1000);
  const q = Object.keys(params).sort()
    .map(k => encodeURIComponent(k)+'='+encodeURIComponent((''+params[k]).replace(/[!'()*]/g,'')))
    .join('&');
  return q + '&w_rid=' + md5(q + mk);
}
function json(obj, status=200, extra={}){
  return new Response(JSON.stringify(obj), {status, headers:{'Content-Type':'application/json;charset=utf-8', ...CORS, ...extra}});
}

export default {
  async fetch(req, env, ctx){
    if (req.method === 'OPTIONS') return new Response(null, {headers: CORS});
    const url = new URL(req.url);
    const mid = (url.searchParams.get('mid') || '').replace(/\D/g, '');
    const n = Math.max(1, Math.min(30, parseInt(url.searchParams.get('n') || '10')));
    if (!mid) return json({error: '缺少 mid（UID）'}, 400);

    // 3 分钟缓存：同一 UID 短时间内重复查直接走缓存，省额度 + 降风控
    const cache = caches.default;
    const cacheKey = new Request(`https://cache/${mid}/${n}`);
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    try {
      const cookie = await getBuvid();
      const k = await getKeys(cookie);
      const qs = sign({mid, pn:1, ps:n, order:'pubdate', platform:'web', web_location:1550101}, k.img, k.sub);
      const up = await fetch(`https://api.bilibili.com/x/space/wbi/arc/search?${qs}`, {
        headers: headers(cookie, `https://space.bilibili.com/${mid}/video`),
      });
      const t = await up.text();
      let d; try{ d = JSON.parse(t); }catch(e){ return json({error:'B站风控了中转 IP（返回非 JSON）。可稍后重试；持续失败需换取数方案'}); }
      if (d.code !== 0) return json({error: `B站返回 ${d.code}：${d.message}`, code: d.code});
      const vl = (d.data && d.data.list && d.data.list.vlist) || [];
      const resp = json({
        name: vl[0] ? vl[0].author : '',
        mid,
        list: vl.map(v => ({bvid:v.bvid, title:v.title, play:v.play, created:v.created, length:v.length})),
      }, 200, {'Cache-Control': 'public, max-age=180'});
      ctx.waitUntil(cache.put(cacheKey, resp.clone()));
      return resp;
    } catch (e) {
      return json({error: '抓取失败：' + (e && e.message || e)}, 502);
    }
  },
};
