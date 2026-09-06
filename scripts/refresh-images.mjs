import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {load} from 'cheerio';
const urls=new Set();
const hosts=new Set(['blog-malu.oss-accelerate.aliyuncs.com','blog-malu.oss-cn-beijing.aliyuncs.com','malu-picture.oss-cn-beijing.aliyuncs.com']);
for(const path of execFileSync('git',['ls-files','-z','post/**/*.html'],{encoding:'utf8'}).split('\0').filter(Boolean)){
  const $=load(await readFile(path,'utf8'));
  $('.article-post img').each((_,img)=>{const src=$(img).attr('data-original')||$(img).attr('src');if(src){const u=new URL(src,'https://malu.moe');if(hosts.has(u.hostname)){u.protocol='https:';urls.add(u.href)}}});
}
const metadata={};const list=[...urls].sort();
for(let start=0;start<list.length;start+=6){
  await Promise.all(list.slice(start,start+6).map(async src=>{
    try{
      const u=new URL(src);u.searchParams.set('x-oss-process','image/info');
      const response=await fetch(u,{signal:AbortSignal.timeout(10000)});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const info=await response.json();let width=Number(info.ImageWidth?.value),height=Number(info.ImageHeight?.value);
      if(!width||!height)throw new Error('Missing dimensions');
      if([5,6,7,8].includes(Number(info.Orientation?.value)))[width,height]=[height,width];
      metadata[src]={width,height};
    }catch(error){console.error(`${src}: ${error.message}`)}
  }));
}
await writeFile('assets/image-metadata.json',JSON.stringify(metadata,null,2)+'\n');
console.log(`Cached dimensions for ${Object.keys(metadata).length}/${urls.size} OSS images.`);
